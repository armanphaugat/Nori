from fastapi import APIRouter, Depends

from backend.middleware.auth import verify_access_token
from backend.controllers.analytics_controller import handle_get_analytics_summary

analytics_router = APIRouter()

analytics_router.add_api_route("/summary", handle_get_analytics_summary, methods=["GET"], dependencies=[Depends(verify_access_token)])