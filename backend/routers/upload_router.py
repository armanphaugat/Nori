from fastapi import APIRouter, Depends, Request
from backend.middleware.auth import *
from backend.middleware.rate_limiter import upload_rate_limit
from backend.controllers.upload_controller import *
from python.deletion import *
from fastapi import HTTPException

upload_router = APIRouter()
upload_router.add_api_route("/all",         handle_get_all_uploads,   methods=["GET"],    dependencies=[Depends(require_guild_admin_query)])
upload_router.add_api_route("/sub-urls",    handle_get_sub_urls,      methods=["GET"],    dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/my-uploads",  handle_get_my_uploads,    methods=["GET"],    dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/website",     handle_upload_website,    methods=["POST"],   dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/url",         handle_upload_url,        methods=["POST"],   dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/file",        handle_upload_file,       methods=["POST"],   dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/faq",         handle_upload_faq,        methods=["POST"],   dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/contacts",    handle_upload_contacts,   methods=["POST"],   dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/delete-content/{upload_id}", handle_delete_upload, methods=["DELETE"], dependencies=[Depends(require_guild_admin_query)])
upload_router.add_api_route("/channel-messages", handle_upload_channel_messages, methods=["POST"], dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])
upload_router.add_api_route("/add-github-repo", handle_add_github_repo, methods=["POST"], dependencies=[Depends(require_guild_admin), Depends(upload_rate_limit)])