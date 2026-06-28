import os
import jwt
from fastapi import Depends, HTTPException, Query, Request, status, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dbhelper.db_helper import get_guild_admin
from dotenv import load_dotenv
load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM: str = "HS256"
BOT_SHARED_SECRET: str = os.environ.get("BOT_SHARED_SECRET", "")

bearer_scheme = HTTPBearer(auto_error=True)

async def verify_access_token(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),) -> dict:
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Access token expired",headers={"WWW-Authenticate": "Bearer"},)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid access token",headers={"WWW-Authenticate": "Bearer"},)


async def require_guild_admin(guild_id: str = Form(...),user: dict = Depends(verify_access_token),) -> dict:
    row = await get_guild_admin(guild_id, user["discord_id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not an admin of this guild",)
    return {**user, "guild_id": guild_id, "role": row["role"]}


async def require_guild_admin_query(guild_id: str = Query(...),user: dict = Depends(verify_access_token),) -> dict:
    row = await get_guild_admin(guild_id, user["discord_id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not an admin of this guild",)
    return {**user, "guild_id": guild_id, "role": row["role"]}


async def require_bot_token(request: Request) -> bool:
    token = request.headers.get("X-Bot-Token", "")
    if not token or token != BOT_SHARED_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Invalid or missing bot token",)
    return True