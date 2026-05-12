import os
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dbhelper.db_helper import *
JWT_SECRET: str = os.environ["JWT_SECRET"]
JWT_ALGORITHM: str = "HS256"
BOT_SHARED_SECRET: str = os.environ["BOT_SHARED_SECRET"]
bearer_scheme = HTTPBearer(auto_error=True)

async def verify_access_token(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),) -> dict:
    token=creds.credentials
    try:
        payload=jwt.decode(token,JWT_SECRET,algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Access token expired",headers={"WWW-Authenticate": "Bearer"},)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid access token",headers={"WWW-Authenticate": "Bearer"},)
    
async def require_guild_admin(guild_id:str,user:dict=Depends(verify_access_token),)->dict:
    row=get_guild_admin(guild_id,user["discord_id"])
    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are Not Admin Of This Guild")
    return {**user,"role":row["role"]}

async def require_bot_tokens(request:Request)->bool:
    token = request.headers.get("X-Bot-Token", "")
    if not token or token != BOT_SHARED_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Invalid or missing bot token",)
    return True