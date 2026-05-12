from fastapi import APIRouter, Depends

from backend.middleware.auth import verify_access_token
from backend.controllers.upload_controller import (
    handle_upload,
    handle_upload_contacts,
    handle_get_all_uploads,
    handle_get_sub_urls,
)

upload_router = APIRouter()

upload_router.add_api_route("/",           handle_upload,           methods=["PUT"],  dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/contacts",   handle_upload_contacts,  methods=["PUT"],  dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/all",        handle_get_all_uploads,  methods=["GET"],  dependencies=[Depends(verify_access_token)])
upload_router.add_api_route("/sub-urls",   handle_get_sub_urls,     methods=["GET"],  dependencies=[Depends(verify_access_token)])