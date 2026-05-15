from fastapi import APIRouter, Depends
from backend.middleware.auth import *
from backend.controllers.upload_controller import *

upload_router = APIRouter()

upload_router.add_api_route("/",handle_upload,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
upload_router.add_api_route("/contacts",handle_upload_contacts,methods=["PUT"],dependencies=[Depends(require_guild_admin)])
upload_router.add_api_route("/all",handle_get_all_uploads,methods=["GET"],dependencies=[Depends(require_guild_admin_query)])
upload_router.add_api_route("/sub-urls",handle_get_sub_urls,methods=["GET"],dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/add-faq",handle_get_sub_urls,methods=["POST"],dependencies=[Depends(require_guild_admin)])