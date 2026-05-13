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
    create_session,
    get_admin_user,
    get_session_by_hash,
    get_user_sessions,
    revoke_session,
    revoke_session_by_id,
    upsert_admin_user,
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS   = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
REFRESH_COOKIE_NAME         = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
DISCORD_API                 = os.getenv("DISCORD_API")
DISCORD_CLIENT_ID           = os.environ["DISCORD_CLIENT_ID"]
DISCORD_CLIENT_SECRET       = os.environ["DISCORD_CLIENT_SECRET"]
DISCORD_REDIRECT_URI        = os.environ["DISCORD_REDIRECT_URI"]
DISCORD_OAUTH_URL           = os.environ["DISCORD_OAUTH_URL"]
DISCORD_TOKEN_URL           = os.environ["DISCORD_TOKEN_URL"]

_pending_states: set[str] = set()

def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _make_access_token(discord_id: str, guild_ids: list[str]) -> str:
    now = datetime.now()
    payload = {
        "sub":        discord_id,
        "discord_id": discord_id,
        "guilds":     guild_ids,
        "iat":        now,
        "exp":        now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86_400,
        path="/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/auth",
        httponly=True,
        samesite="strict",
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
    d_access    = discord_tokens["access_token"]
    d_refresh   = discord_tokens["refresh_token"]
    d_expiry    = datetime.now(timezone.utc) + timedelta(seconds=discord_tokens["expires_in"])

    me        = await _call_discord_api("/users/@me", d_access)
    guilds    = await _call_discord_api("/users/@me/guilds", d_access)
    guild_ids = [g["id"] for g in guilds]

    upsert_admin_user(
        discord_id=me["id"],
        username=f"{me['username']}#{me.get('discriminator', '0')}",
        avatar=me.get("avatar"),
        email=me.get("email"),
        discord_access_token=d_access,
        discord_refresh_token=d_refresh,
        discord_token_expiry=d_expiry,
    )

    raw_refresh = secrets.token_urlsafe(32)
    create_session(
        discord_id=me["id"],
        refresh_token_hash=_hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    access_token = _make_access_token(me["id"], guild_ids)

    redirect = RedirectResponse(url=f"/#token={access_token}", status_code=302)
    _set_refresh_cookie(redirect, raw_refresh)
    return redirect


async def handle_refresh_tokens(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> dict:
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token")

    token_hash = _hash_token(rt)
    session    = get_session_by_hash(token_hash)

    if not session:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    if session["revoked"]:
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    if session["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")
    revoke_session(session["id"])
    new_raw_refresh = secrets.token_urlsafe(32)
    create_session(
        discord_id=session["discord_id"],
        refresh_token_hash=_hash_token(new_raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    user         = get_admin_user(session["discord_id"])
    access_token = _make_access_token(session["discord_id"], user.get("cached_guild_ids", []))

    _set_refresh_cookie(response, new_raw_refresh)
    return {"access_token": access_token, "token_type": "bearer"}


async def handle_logout(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    user: dict = Depends(verify_access_token),
) -> dict:
    if rt:
        session = get_session_by_hash(_hash_token(rt))
        if session:
            revoke_session(session["id"])

    _clear_refresh_cookie(response)
    return {"detail": "Logged out"}


async def handle_get_me(user: dict = Depends(verify_access_token)) -> dict:
    row = get_admin_user(user["discord_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "discord_id": row["discord_id"],
        "username":   row["username"],
        "avatar":     row["avatar"],
        "email":      row["email"],
        "guilds":     user.get("guilds", []),
    }


async def handle_list_sessions(user: dict = Depends(verify_access_token)) -> dict:
    sessions = get_user_sessions(user["discord_id"])
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
    success = revoke_session_by_id(session_id, owner_discord_id=user["discord_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not yours")
    return {"detail": "Session revoked"}