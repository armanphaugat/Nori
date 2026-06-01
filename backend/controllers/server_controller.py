from fastapi import Form, HTTPException, Query
from dbhelper.db_helper import *
from backend.middleware.auth import *


def _require_server_updated(result: int, label: str) -> None:
    if result != 1:
        raise HTTPException(status_code=404, detail=f"Server not found or {label} not updated")


async def handle_add_server(
    guild_id: str = Form(...),
    name:     str = Form(...),
    user:     dict = Depends(verify_access_token),
) -> dict:
    add_server(guild_id, name)
    add_guild_admin(
        guild_id=guild_id,
        discord_id=user["discord_id"],
        role="owner",
        granted_by=user["discord_id"],
    )
    return {"status": "success", "message": "Server added successfully"}


async def handle_update_max_token(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    _require_server_updated(update_max_tokens(guild_id, k), "max_tokens")
    return {"status": "success", "message": "Max tokens updated successfully"}


async def handle_update_pause(
    guild_id: str = Form(...),
    is_paused: bool = Form(...),
) -> dict:
    _require_server_updated(update_pause_status(guild_id, is_paused), "pause status")
    return {"status": "success", "message": "Bot pause status updated successfully"}


async def handle_get_server_config(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> dict:
    row = get_server(guild_id)
    if not row:
        raise HTTPException(status_code=404, detail="Server not found — register it first via /server/add")
    return {
        "guild_id":    row["server_id"],
        "name":        row["server_name"],
        "prefix":      row["prefix"],
        "max_tokens":  row["max_tokens"],
        "mod_channel": row["mod_channel"],
        "kb_spec_id":  row["kb_spec_id"],
        "web_spec_id": row["web_spec_id"],
        "is_paused":   row.get("is_paused", False),
        "added_at":    row["added_at"].isoformat() if row.get("added_at") else None,
        "updated_at":  row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


async def handle_get_user_servers_with_status(
    user: dict = Depends(verify_access_token),
) -> dict:
    discord_id = user.get("discord_id")
    if not discord_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    try:
        servers = get_user_servers_with_config_status(discord_id)
        return {
            "status": "success",
            "count": len(servers),
            "servers": servers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def handle_get_all_servers_with_status(
    user: dict = Depends(verify_access_token),
) -> dict:
    try:
        servers = get_all_servers_with_config_status()
        configured   = len([s for s in servers if s["config_status"] == "configured"])
        partial      = len([s for s in servers if s["config_status"] == "partial"])
        unconfigured = len([s for s in servers if s["config_status"] == "unconfigured"])
        return {
            "status": "success",
            "total_servers": len(servers),
            "stats": {
                "configured":   configured,
                "partial":      partial,
                "unconfigured": unconfigured,
            },
            "servers": servers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))