import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from dotenv import load_dotenv
load_dotenv()
import httpx
import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from backend.middleware.auth import JWT_ALGORITHM, JWT_SECRET, verify_access_token
from dbhelper.db_helper import *
auth_router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME")
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))
DISCORD_API = os.getenv("DISCORD_API")
DISCORD_CLIENT_ID = os.environ["DISCORD_CLIENT_ID"]
DISCORD_CLIENT_SECRET = os.environ["DISCORD_CLIENT_SECRET"]
DISCORD_REDIRECT_URI = os.environ["DISCORD_REDIRECT_URI"]
DISCORD_OAUTH_URL = os.environ["DISCORD_OAUTH_URL"]
DISCORD_TOKEN_URL = os.environ["DISCORD_TOKEN_URL"]


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _make_access_token(discord_id: str, guild_ids: list[str], username: str) -> str:
    now = datetime.now()
    payload = {
        "sub": discord_id,
        "discord_id": discord_id,
        "username": username,
        "guilds": guild_ids,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86_400,
        path="/auth",
    )


def _clear_refresh_cookie(response: Response):
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/auth", httponly=True, samesite="strict")


async def _discord_api_get(path: str, access_token: str) -> dict:
    """Call a Discord API endpoint with the user's access token."""
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


_pending_states: set[str] = set()


def _generate_state() -> str:
    state = secrets.token_urlsafe(32)
    _pending_states.add(state)
    return state


def _verify_and_consume_state(state: str) -> None:
    if state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid OAuth state (CSRF check failed)")
    _pending_states.discard(state)


@auth_router.get("/discord")
async def discord_login() -> RedirectResponse:
    state = _generate_state()
    params = urlencode(
        {
            "client_id": DISCORD_CLIENT_ID,
            "redirect_uri": DISCORD_REDIRECT_URI,
            "response_type": "code",
            "scope": "identify guilds guilds.members.read email",
            "state": state,
            "prompt": "none",
        }
    )
    return RedirectResponse(url=f"{DISCORD_OAUTH_URL}?{params}")


@auth_router.get("/discord/callback")
async def discord_callback(
    code: str,
    state: str,
    request: Request,
) -> RedirectResponse:
    # 1. CSRF check
    _verify_and_consume_state(state)

    # 2. Exchange authorization code for Discord tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            DISCORD_TOKEN_URL,
            data={
                "client_id": DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange Discord code")

    discord_tokens = token_resp.json()
    d_access = discord_tokens["access_token"]
    d_refresh = discord_tokens["refresh_token"]
    d_expires_in = discord_tokens["expires_in"]
    d_expiry = datetime.now(timezone.utc) + timedelta(seconds=d_expires_in)

    # 3. Fetch user info from Discord
    me = await _discord_api_get("/users/@me", d_access)
    guilds = await _discord_api_get("/users/@me/guilds", d_access)
    guild_ids = [g["id"] for g in guilds]

    # Build username once for reuse
    username = f"{me['username']}#{me.get('discriminator', '0')}"

    # 4. Upsert admin_users row
    upsert_admin_user(
        discord_id=me["id"],
        username=username,
        avatar=me.get("avatar"),
        email=me.get("email"),
        discord_access_token=d_access,        # TODO: encrypt before storing
        discord_refresh_token=d_refresh,      # TODO: encrypt before storing
        discord_token_expiry=d_expiry,
    )

    # 5. Create session — store only the hash
    raw_refresh = secrets.token_urlsafe(32)
    create_session(
        discord_id=me["id"],
        refresh_token_hash=_hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )

    # 6. Issue JWT access token
    access_token = _make_access_token(me["id"], guild_ids, username)

    # 7. Set HttpOnly refresh cookie + redirect with access token in fragment
    redirect = RedirectResponse(url=f"/#token={access_token}", status_code=302)
    _set_refresh_cookie(redirect, raw_refresh)
    return redirect


@auth_router.post("/refresh")
async def refresh_tokens(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
) -> dict:
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token")
    token_hash = _hash_token(rt)
    session = get_session_by_hash(token_hash)
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

    user = get_admin_user(session["discord_id"])
    access_token = _make_access_token(
        session["discord_id"],
        user.get("cached_guild_ids", []),
        user.get("username", ""),
    )

    _set_refresh_cookie(response, new_raw_refresh)
    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.post("/logout")
async def logout(
    response: Response,
    rt: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    user: dict = Depends(verify_access_token),
) -> dict:
    if rt:
        token_hash = _hash_token(rt)
        session = get_session_by_hash(token_hash)
        if session:
            revoke_session(session["id"])

    _clear_refresh_cookie(response)
    return {"detail": "Logged out"}


@auth_router.get("/me")
async def get_me(user: dict = Depends(verify_access_token)) -> dict:
    row = get_admin_user(user["discord_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "discord_id": row["discord_id"],
        "username": row["username"],
        "avatar": row["avatar"],
        "email": row["email"],
        "guilds": user.get("guilds", []),
    }


@auth_router.get("/sessions")
async def list_sessions(user: dict = Depends(verify_access_token)) -> dict:
    sessions = get_user_sessions(user["discord_id"])
    safe = [
        {
            "id": str(s["id"]),
            "issued_at": s["issued_at"].isoformat(),
            "expires_at": s["expires_at"].isoformat(),
            "user_agent": s.get("user_agent"),
            "ip_address": s.get("ip_address"),
        }
        for s in sessions
        if not s["revoked"]
    ]
    return {"sessions": safe}


@auth_router.post("/sessions/{session_id}/revoke")
async def revoke_other_session(
    session_id: str,
    user: dict = Depends(verify_access_token),
) -> dict:
    success = revoke_session_by_id(session_id, owner_discord_id=user["discord_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not yours")
    return {"detail": "Session revoked"}