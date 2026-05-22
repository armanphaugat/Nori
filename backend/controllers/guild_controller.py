import os

import httpx
from fastapi import Depends, HTTPException, status

from backend.middleware.auth import verify_access_token
from dbhelper.db_helper import get_admin_user

DISCORD_API = os.getenv("DISCORD_API", "https://discord.com/api/v10")

from dbhelper.db_helper import *

async def handle_get_guilds(
    user: dict = Depends(verify_access_token),
) -> dict:
    row = get_admin_user(user["discord_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{DISCORD_API}/users/@me/guilds",
            headers={"Authorization": f"Bearer {row['discord_access_token']}"},
            timeout=10,
        )

    if resp.status_code == 401:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Discord token expired")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Discord API error: {resp.status_code}")
    admin_guild_ids = get_user_guild_ids(user["discord_id"])
    guilds = resp.json()
    return {
        "guilds": [
            {
                "id": g["id"],
                "name": g["name"],
                "icon": (
                    f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png"
                    if g.get("icon") else None
                ),
                "owner": g.get("owner", False),
            }
            for g in guilds
            if g["id"] in admin_guild_ids
        ]
    }

async def handle_get_guild_channels(
    guild_id: str,
    user: dict = Depends(verify_access_token),
) -> dict:
    bot_token = os.getenv("DISCORD_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(
            status_code=500,
            detail="DISCORD_BOT_TOKEN not configured on server",
        )

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{DISCORD_API}/guilds/{guild_id}/channels",
            headers={"Authorization": f"Bot {bot_token}"},
            timeout=10,
        )

    if resp.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail="Bot is not in this guild — invite it first",
        )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Discord API error: {resp.status_code}",
        )

    channels = resp.json()
    text_channels = [
        {"id": c["id"], "name": c["name"], "type": c["type"]}
        for c in channels
        if c["type"] in (0, 5)
    ]
    text_channels.sort(key=lambda c: c["name"])
    return {"channels": text_channels}

async def handle_get_eligible_guilds(
    user: dict = Depends(verify_access_token),
) -> dict:
    row = get_admin_user(user["discord_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{DISCORD_API}/users/@me/guilds",
            headers={"Authorization": f"Bearer {row['discord_access_token']}"},
            timeout=10,
        )

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Discord token expired")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Discord API error: {resp.status_code}")

    guilds = resp.json()

    ADMIN_PERMISSION = 0x8

    return {
        "guilds": [
            {
                "id": g["id"],
                "name": g["name"],
                "icon": (
                    f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png"
                    if g.get("icon") else None
                ),
                "owner": g.get("owner", False),
                "registered": bool(get_server(g["id"])),
            }
            for g in guilds
            if g.get("owner") or (int(g.get("permissions", 0)) & ADMIN_PERMISSION)
        ]
    }