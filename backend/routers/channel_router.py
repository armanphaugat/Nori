from fastapi import APIRouter, Depends
from backend.middleware.auth import *
from backend.controllers.channel_controller import *

channel_router = APIRouter()

channel_router.add_api_route("/add",handle_add_channel,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/delete",handle_delete_channel,methods=["DELETE"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/add-mod",handle_add_mod_channel,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/list",handle_get_channels,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)
channel_router.add_api_route("/add-support-category",handle_get_channels,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)