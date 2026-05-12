from typing import List

from fastapi import Form, HTTPException

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