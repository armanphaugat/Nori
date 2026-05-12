from fastapi import APIRouter, Depends

from backend.middleware.auth import verify_access_token
from backend.controllers.auth_controller import (
    handle_discord_callback,
    handle_discord_login,
    handle_get_me,
    handle_list_sessions,
    handle_logout,
    handle_refresh_tokens,
    handle_revoke_session,
)

auth_router = APIRouter()

auth_router.add_api_route("/discord",                       handle_discord_login,    methods=["GET"])
auth_router.add_api_route("/discord/callback",              handle_discord_callback, methods=["GET"])
auth_router.add_api_route("/refresh",                       handle_refresh_tokens,   methods=["POST"])
auth_router.add_api_route("/logout",                        handle_logout,           methods=["POST"], dependencies=[Depends(verify_access_token)])
auth_router.add_api_route("/me",                            handle_get_me,           methods=["GET"],  dependencies=[Depends(verify_access_token)])
auth_router.add_api_route("/sessions",                      handle_list_sessions,    methods=["GET"],  dependencies=[Depends(verify_access_token)])
auth_router.add_api_route("/sessions/{session_id}/revoke",  handle_revoke_session,   methods=["POST"], dependencies=[Depends(verify_access_token)])