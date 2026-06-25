import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

from backend.middleware.auth import JWT_ALGORITHM, JWT_SECRET, verify_access_token
from dbhelper.db_helper import (
    add_guild_admin,
    create_session,
    get_admin_user,
    get_server,
    get_session_by_hash,
    get_user_guild_ids,
    get_user_sessions,
    remove_guild_admin,
    revoke_session,
    revoke_session_by_id,
    upsert_admin_user,
)

ADMINISTRATOR_PERMISSION = 0x8
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
REFRESH_COOKIE_NAME         = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
DISCORD_API                 = os.getenv("DISCORD_API")
DISCORD_CLIENT_ID           = os.environ["DISCORD_CLIENT_ID"]
DISCORD_CLIENT_SECRET       = os.environ["DISCORD_CLIENT_SECRET"]
DISCORD_REDIRECT_URI        = os.environ["DISCORD_REDIRECT_URI"]
DISCORD_OAUTH_URL           = os.environ["DISCORD_OAUTH_URL"]
DISCORD_TOKEN_URL           = os.environ["DISCORD_TOKEN_URL"]
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")
_pending_states: set[str] = set()

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _make_access_token(discord_id: str, guild_ids: list[str], username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub":        discord_id,
        "discord_id": discord_id,
        "username":   username,
        "guilds":     guild_ids,
        "iat":        now,
        "exp":        now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


IS_PROD = os.getenv("ENV", "development") == "production"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=IS_PROD,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86_400,
        path="/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/auth",
        httponly=True,
        samesite="lax",
    )


async def _call_discord_api(path: str, access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{DISCORD_API}{path}",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Discord API error on {path}: {resp.status_code}",
        )
    return resp.json()


def _generate_state() -> str:
    state = secrets.token_urlsafe(32)
    _pending_states.add(state)
    return state


def _verify_and_consume_state(state: str) -> None:
    if state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state (CSRF check failed)")
    _pending_states.discard(state)


async def _sync_guild_admins(discord_id: str, discord_access_token: str) -> None:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{DISCORD_API}/users/@me/guilds",
                headers={"Authorization": f"Bearer {discord_access_token}"},
                timeout=10,
            )
        if resp.status_code != 200:
            return
        guilds = resp.json()
        synced: set[str] = set()
        for g in guilds:
            is_owner = g.get("owner", False)
            is_admin = is_owner or bool(int(g.get("permissions", 0)) & ADMINISTRATOR_PERMISSION)
            if not is_admin:
                continue
            role = "owner" if is_owner else "admin"
            await add_guild_admin(
                guild_id=g["id"],
                discord_id=discord_id,
                role=role,
                granted_by=discord_id,
            )
            synced.add(g["id"])
        current_db_guilds = await get_user_guild_ids(discord_id)
        for stale_guild_id in current_db_guilds - synced:
            await remove_guild_admin(stale_guild_id, discord_id)

    except Exception as e:
        print(f"[sync_guild_admins] Non-fatal error for {discord_id}: {e}")


async def handle_discord_login() -> RedirectResponse:
    state  = _generate_state()
    params = urlencode({
        "client_id":     DISCORD_CLIENT_ID,
        "redirect_uri":  DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope":         "identify guilds guilds.members.read email",
        "state":         state,
        "prompt":        "none",
    })
    return RedirectResponse(url=f"{DISCORD_OAUTH_URL}?{params}")


async def handle_discord_invite(guild_id: str | None = None) -> RedirectResponse:
    state  = _generate_state()
    params = {
        "client_id":     DISCORD_CLIENT_ID,
        "redirect_uri":  DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope":         "identify guilds guilds.members.read email bot applications.commands",
        "permissions":   "8",
        "state":         state,
    }
    if guild_id:
        params["guild_id"] = guild_id
    return RedirectResponse(url=f"{DISCORD_OAUTH_URL}?{urlencode(params)}")


async def handle_discord_callback(code: str, state: str, request: Request) -> RedirectResponse:
    _verify_and_consume_state(state)

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            DISCORD_TOKEN_URL,
            data={
                "client_id":     DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange Discord code")

    discord_tokens = token_resp.json()
    d_access  = discord_tokens["access_token"]
    d_refresh = discord_tokens["refresh_token"]
    d_expiry  = datetime.now(timezone.utc) + timedelta(seconds=discord_tokens["expires_in"])

    me        = await _call_discord_api("/users/@me", d_access)
    guilds    = await _call_discord_api("/users/@me/guilds", d_access)
    guild_ids = [g["id"] for g in guilds]
    username = f"{me['username']}#{me.get('discriminator', '0')}"

    await upsert_admin_user(
        discord_id=me["id"],
        username=username,
        avatar=me.get("avatar"),
        email=me.get("email"),
        discord_access_token=d_access,
        discord_refresh_token=d_refresh,
        discord_token_expiry=d_expiry,
    )
    await _sync_guild_admins(me["id"], d_access)

    raw_refresh = secrets.token_urlsafe(32)
    await create_session(
        discord_id=me["id"],
        refresh_token_hash=_hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    # Pass full formatted username (consistent with what's stored in DB)
    access_token = _make_access_token(me["id"], guild_ids, username)
    guild_id = request.query_params.get("guild_id")
    url = f"{FRONTEND_URL}/#token={access_token}"
    if guild_id:
        url += f"&guild_id={guild_id}"
    redirect = RedirectResponse(url=url, status_code=302)
    _set_refresh_cookie(redirect, raw_refresh)
    return redirect


async def handle_refresh_tokens(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> dict:
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token")

    token_hash = _hash_token(rt)
    session    = await get_session_by_hash(token_hash)

    if not session:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    if session["revoked"]:
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    if session["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    await revoke_session(session["id"])
    new_raw_refresh = secrets.token_urlsafe(32)
    await create_session(
        discord_id=session["discord_id"],
        refresh_token_hash=_hash_token(new_raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    user = await get_admin_user(session["discord_id"])

    # Re-sync guild admins on every token refresh using stored Discord token
    if user:
        await _sync_guild_admins(user["discord_id"], user["discord_access_token"])

    guild_ids    = await get_user_guild_ids(session["discord_id"])
    # Pass username from DB row, consistent with login flow
    access_token = _make_access_token(
        session["discord_id"],
        list(guild_ids),
        user.get("username", "") if user else "",
    )

    _set_refresh_cookie(response, new_raw_refresh)
    return {"access_token": access_token, "token_type": "bearer"}


async def handle_logout(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> dict:
    if rt:
        session = await get_session_by_hash(_hash_token(rt))
        if session:
            await revoke_session(session["id"])
    _clear_refresh_cookie(response)
    return {"detail": "Logged out"}


async def handle_get_me(user: dict = Depends(verify_access_token)) -> dict:
    row = await get_admin_user(user["discord_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "discord_id": row["discord_id"],
        "username":   row["username"],
        "avatar":     row["avatar"],
        "email":      row["email"],
        "guilds":     user.get("guilds", []),
        "discord_client_id": DISCORD_CLIENT_ID,
    }


async def handle_list_sessions(user: dict = Depends(verify_access_token)) -> dict:
    sessions = await get_user_sessions(user["discord_id"])
    safe = [
        {
            "id":         str(s["id"]),
            "issued_at":  s["issued_at"].isoformat(),
            "expires_at": s["expires_at"].isoformat(),
            "user_agent": s.get("user_agent"),
            "ip_address": s.get("ip_address"),
        }
        for s in sessions
        if not s["revoked"]
    ]
    return {"sessions": safe}


async def handle_revoke_session(
    session_id: str,
    user: dict = Depends(verify_access_token),
) -> dict:
    success = await revoke_session_by_id(session_id, owner_discord_id=user["discord_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not yours")
    return {"detail": "Session revoked"}