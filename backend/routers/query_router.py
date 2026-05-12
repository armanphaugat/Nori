from fastapi import APIRouter, Depends

from backend.middleware.auth import verify_access_token
from backend.controllers.query_controller import handle_query

query_router = APIRouter()

query_router.add_api_route("/", handle_query, methods=["POST"], dependencies=[Depends(verify_access_token)])