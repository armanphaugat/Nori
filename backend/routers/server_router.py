from fastapi import APIRouter, Depends

from backend.middleware.auth import *
from backend.controllers.server_controller import *

server_router = APIRouter()

server_router.add_api_route("/add",handle_add_server,methods=["POST"],dependencies=[Depends(verify_access_token)])
server_router.add_api_route("/config",handle_get_server_config,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)
server_router.add_api_route("/list",handle_get_user_servers_with_status,methods=["GET"],dependencies=[Depends(verify_access_token)])
server_router.add_api_route("/list-all",handle_get_all_servers_with_status,methods=["GET"],dependencies=[Depends(verify_access_token)])