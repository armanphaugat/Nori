from typing import List

from fastapi import Form, HTTPException
from backend.middleware.auth import *
from dbhelper.db_helper import insert_mod_channel, remove_channel, set_channel


async def handle_add_channel(
    guild_id:   str  = Form(...),
    channel_id: List = Form(...),
) -> dict:
    try:
        for channel in channel_id:
            set_channel(guild_id, channel)
        return {"status": "success", "message": "Channel(s) added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add channel: {e}")


async def handle_delete_channel(
    guild_id:   str = Form(...),
    channel_id: str = Form(...),
) -> dict:
    try:
        remove_channel(guild_id, channel_id)
        return {"status": "success", "message": "Channel deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete channel: {e}")


async def handle_add_mod_channel(
    guild_id:   str = Form(...),
    channel_id: str = Form(...),
) -> dict:
    try:
        insert_mod_channel(guild_id, channel_id)
        return {"status": "success", "message": "Mod channel added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add mod channel: {e}")
    
async def handle_get_channels(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),   # already imported via middleware.auth *
) -> dict:
    from dbhelper.db_helper import get_channels
    from dbhelper.db_helper import get_mod_channel
    try:
        channels    = get_channels(guild_id)        # list of {"channel_id": "..."}
        mod_row     = get_mod_channel(guild_id)     # {"mod_channel": "..." | None}
        return {
            "status":      "success",
            "channel_ids": [c["channel_id"] for c in channels],
            "mod_channel": mod_row["mod_channel"] if mod_row else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get channels: {e}")