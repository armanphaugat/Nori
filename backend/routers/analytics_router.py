from fastapi import APIRouter, Depends

from backend.middleware.auth import *
from backend.controllers.analytics_controller import handle_get_analytics_summary

analytics_router = APIRouter()

analytics_router.add_api_route("/summary", handle_get_analytics_summary, methods=["GET"], dependencies=[Depends(require_guild_admin_query)])