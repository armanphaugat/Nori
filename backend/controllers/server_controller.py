from fastapi import Form, HTTPException

from dbhelper.db_helper import *
from backend.middleware.auth import *
MAX_CHUNK_SIZE    = 1000
MAX_CHUNK_OVERLAP = 1000
MIN_CHUNK_OVERLAP = 100


def _require_server_updated(result: int, label: str) -> None:
    if result != 1:
        raise HTTPException(status_code=404, detail=f"Server not found or {label} not updated")


async def handle_add_server(
    guild_id: str = Form(...),
    name:     str = Form(...),
) -> dict:
    add_server(guild_id, name)
    return {"status": "success", "message": "Server added successfully"}


async def handle_update_faiss_k(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    if k <= 0:
        raise HTTPException(status_code=400, detail="'k' must be greater than 0")
    _require_server_updated(update_faiss_k(guild_id, k), "faiss_k")
    return {"status": "success", "message": "faiss_k updated successfully"}


async def handle_update_bm25_k(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    if k <= 0:
        raise HTTPException(status_code=400, detail="'k' must be greater than 0")
    _require_server_updated(update_bm25_k(guild_id, k), "bm25_k")
    return {"status": "success", "message": "bm25_k updated successfully"}


async def handle_update_temperature(
    guild_id: str = Form(...),
    k:        float = Form(...),
) -> dict:
    if not (0 <= k <= 1):
        raise HTTPException(status_code=400, detail="Temperature must be between 0 and 1")
    _require_server_updated(update_temperature(guild_id, k), "temperature")
    return {"status": "success", "message": "Temperature updated successfully"}


async def handle_update_chunk_size(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    if not (0 < k < MAX_CHUNK_SIZE):
        raise HTTPException(status_code=400, detail=f"Chunk size must be between 1 and {MAX_CHUNK_SIZE}")
    _require_server_updated(update_chunk_size(guild_id, k), "chunk_size")
    return {"status": "success", "message": "Chunk size updated successfully"}


async def handle_update_chunk_overlap(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    if not (MIN_CHUNK_OVERLAP <= k <= MAX_CHUNK_OVERLAP):
        raise HTTPException(status_code=400, detail=f"Chunk overlap must be between {MIN_CHUNK_OVERLAP} and {MAX_CHUNK_OVERLAP}")
    _require_server_updated(update_chunk_overlap(guild_id, k), "chunk_overlap")
    return {"status": "success", "message": "Chunk overlap updated successfully"}


async def handle_update_max_token(
    guild_id: str = Form(...),
    k:        int = Form(...),
) -> dict:
    _require_server_updated(update_max_tokens(guild_id, k), "max_tokens")
    return {"status": "success", "message": "Max tokens updated successfully"}


async def handle_insert_system_prompt(
    guild_id: str = Form(...),
    text:     str = Form(...),
) -> dict:
    update_system_prompt(guild_id, text)
    return {"status": "success", "message": "System prompt inserted successfully"}


async def handle_update_system_prompt(
    guild_id: str = Form(...),
    text:     str = Form(...),
) -> dict:
    update_system_prompt(guild_id, text)
    return {"status": "success", "message": "System prompt updated successfully"}

async def handle_get_server_config(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),   # already imported via middleware.auth *
) -> dict:
    from dbhelper.db_helper import get_server
    row = get_server(guild_id)
    if not row:
        raise HTTPException(status_code=404, detail="Server not found — register it first via /server/add")
    return {
        "guild_id":       row["server_id"],
        "name":           row["server_name"],
        "prefix":         row["prefix"],
        "max_tokens":     row["max_tokens"],
        "temperature":    row["temperature"],
        "chunk_size":     row["chunk_size"],
        "chunk_overlap":  row["chunk_overlap"],
        "faiss_k":        row["faiss_k"],
        "bm25_k":         row["bm25_k"],
        "system_prompt":  row["system_prompt"],
        "mod_channel":    row["mod_channel"],
        "added_at":       row["added_at"].isoformat() if row.get("added_at") else None,
        "updated_at":     row["updated_at"].isoformat() if row.get("updated_at") else None,
    }