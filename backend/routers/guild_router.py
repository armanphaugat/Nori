from fastapi import APIRouter, Depends
from backend.middleware.auth import verify_access_token
from backend.controllers.guild_controller import *

guild_router = APIRouter()

guild_router.add_api_route("/",handle_get_guilds,methods=["GET"],dependencies=[Depends(verify_access_token)],)
guild_router.add_api_route("/{guild_id}/channels",handle_get_guild_channels,methods=["GET"],dependencies=[Depends(verify_access_token)],)
guild_router.add_api_route("/eligible",handle_get_eligible_guilds,methods=["GET"],dependencies=[Depends(verify_access_token)],)