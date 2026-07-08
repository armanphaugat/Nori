from fastapi import APIRouter, Depends
from backend.middleware.auth import *
from backend.controllers.channel_controller import *

channel_router = APIRouter()

channel_router.add_api_route("/add",handle_add_channel,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/delete",handle_delete_channel,methods=["DELETE"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/add-mod",handle_add_mod_channel,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/delete-mod",handle_delete_mod_channel,methods=["DELETE"],dependencies=[Depends(require_guild_admin)])
channel_router.add_api_route("/list",handle_get_channels,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)
channel_router.add_api_route("/add-support-category",handle_add_support_channel,methods=["PUT"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/add-channel-config",handle_add_channel_config,methods=["POST"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/list-all-channel-config",handle_get_all_channel_configs,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)
channel_router.add_api_route("/update-channel-config",handle_update_channel_config,methods=["PATCH"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/delete-channel-config",handle_delete_channel_config,methods=["DELETE"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/add-channel-knowledge-base",handle_add_channel_specific_knowledge_base,methods=["POST"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/get-channel-knowledge-base",handle_get_channel_specific_knowledge_base,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)
channel_router.add_api_route("/delete-channel-knowledge-base",handle_delete_channel_specific_knowledge_base,methods=["DELETE"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/delete-all-channel-knowledge-base",handle_delete_all_channel_specific_knowledge_base,methods=["DELETE"],dependencies=[Depends(require_guild_admin)],)
channel_router.add_api_route("/list-all-channel-knowledge-base",handle_list_all_channel_knowledge_base,methods=["GET"],dependencies=[Depends(require_guild_admin_query)],)

