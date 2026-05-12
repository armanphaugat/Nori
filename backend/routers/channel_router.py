from fastapi import APIRouter, Depends

from backend.middleware.auth import verify_access_token
from backend.controllers.channel_controller import *

channel_router = APIRouter()

channel_router.add_api_route("/add",          handle_add_channel,      methods=["PUT"],    dependencies=[Depends(verify_access_token)])
channel_router.add_api_route("/delete",       handle_delete_channel,   methods=["DELETE"], dependencies=[Depends(verify_access_token)])
channel_router.add_api_route("/add-mod",      handle_add_mod_channel,  methods=["PUT"],    dependencies=[Depends(verify_access_token)])