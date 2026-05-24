import os
import time

import httpx
from fastapi import Depends, HTTPException, status

from backend.middleware.auth import require_guild_admin_query, verify_access_token
from dbhelper.db_helper import get_admin_user, get_server, get_user_guild_ids

DISCORD_API      = os.getenv("DISCORD_API", "https://discord.com/api/v10")
ADMIN_PERMISSION = 0x8
CACHE_TTL        = 30

_eligible_cache: dict[str, tuple[float, dict]] = {}

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
            timeout=30,
        )
    if resp.status_code == 401:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Discord token expired")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Discord API error: {resp.status_code}")
    guilds = resp.json()
    return {
        "guilds": [
            {
                "id":    g["id"],
                "name":  g["name"],
                "icon":  (
                    f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png"
                    if g.get("icon") else None
                ),
                "owner": g.get("owner", False),
            }
            for g in guilds
                if g.get("owner") or (int(g.get("permissions", 0)) & ADMIN_PERMISSION)
        ]
    }

async def handle_get_guild_channels(
    guild_id: str,
) -> dict:
    bot_token = os.getenv("DISCORD_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="DISCORD_BOT_TOKEN not configured on server")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{DISCORD_API}/guilds/{guild_id}/channels",
            headers={"Authorization": f"Bot {bot_token}"},
            timeout=10,
        )

    if resp.status_code == 403:
        raise HTTPException(status_code=403, detail="Bot is not in this guild — invite it first")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Discord API error: {resp.status_code}")

    channels = resp.json()

    categories = {
        c["id"]: {"id": c["id"], "name": c["name"], "channels": []}
        for c in channels
        if c["type"] == 4
    }
    uncategorized = {"id": None, "name": "Uncategorized", "channels": []}

    for c in channels:
        if c["type"] not in (0, 5):
            continue
        channel_obj = {
            "id":       c["id"],
            "name":     c["name"],
            "type":     c["type"],
            "position": c.get("position", 0),
        }
        parent_id = c.get("parent_id")
        if parent_id and parent_id in categories:
            categories[parent_id]["channels"].append(channel_obj)
        else:
            uncategorized["channels"].append(channel_obj)

    category_positions = {
        c["id"]: c.get("position", 0)
        for c in channels
        if c["type"] == 4
    }

    for cat in categories.values():
        cat["channels"].sort(key=lambda c: c["position"])
    uncategorized["channels"].sort(key=lambda c: c["position"])

    sorted_categories = sorted(
        categories.values(),
        key=lambda cat: category_positions.get(cat["id"], 0),
    )

    result = []
    if uncategorized["channels"]:
        result.append(uncategorized)
    result.extend(sorted_categories)

    return {"categories": result}


async def handle_get_eligible_guilds(
    user: dict = Depends(verify_access_token),
) -> dict:
    uid = user["discord_id"]
    now = time.time()

    if uid in _eligible_cache:
        ts, cached = _eligible_cache[uid]
        if now - ts < CACHE_TTL:
            return cached

    row = get_admin_user(uid)
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
    result = {
        "guilds": [
            {
                "id":         g["id"],
                "name":       g["name"],
                "icon":       (
                    f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png"
                    if g.get("icon") else None
                ),
                "owner":      g.get("owner", False),
                "registered": bool(get_server(g["id"])),
            }
            for g in guilds
            if g.get("owner") or (int(g.get("permissions", 0)) & ADMIN_PERMISSION)
        ]
    }

    _eligible_cache[uid] = (now, result)
    return result