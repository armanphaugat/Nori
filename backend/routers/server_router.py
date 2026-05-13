from fastapi import APIRouter, Depends

from backend.middleware.auth import *
from backend.controllers.server_controller import (
    handle_add_server,
    handle_update_faiss_k,
    handle_update_bm25_k,
    handle_update_temperature,
    handle_update_chunk_size,
    handle_update_chunk_overlap,
    handle_update_max_token,
    handle_insert_system_prompt,
    handle_update_system_prompt,
)

server_router = APIRouter()

server_router.add_api_route("/add",                    handle_add_server,             methods=["POST"],  dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-faiss-k",         handle_update_faiss_k,         methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-bm25-k",          handle_update_bm25_k,          methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-temperature",     handle_update_temperature,     methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-chunk-size",      handle_update_chunk_size,      methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-chunk-overlap",   handle_update_chunk_overlap,   methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-max-token",       handle_update_max_token,       methods=["PATCH"], dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/insert-system-prompt",   handle_insert_system_prompt,   methods=["PUT"],   dependencies=[Depends(require_guild_admin)])
server_router.add_api_route("/update-system-prompt",   handle_update_system_prompt,   methods=["PUT"],   dependencies=[Depends(require_guild_admin)])