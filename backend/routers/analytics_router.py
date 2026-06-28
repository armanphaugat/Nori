from fastapi import APIRouter, Depends
from backend.middleware.auth import *
from backend.middleware.rate_limiter import analytics_rate_limit
from backend.controllers.analytics_controller import handle_get_analytics_summary, handle_get_all_analytics, handle_get_recent_events,handle_get_analytics_by_channel, handle_get_analytics_by_all_channels

analytics_router = APIRouter()

analytics_router.add_api_route("/summary",          handle_get_analytics_summary, methods=["GET"], dependencies=[Depends(require_guild_admin_query), Depends(analytics_rate_limit)])
analytics_router.add_api_route("/recent-analytics", handle_get_recent_events,     methods=["GET"], dependencies=[Depends(require_guild_admin_query), Depends(analytics_rate_limit)])
analytics_router.add_api_route("/all-analytics",    handle_get_all_analytics,     methods=["GET"], dependencies=[Depends(require_guild_admin_query), Depends(analytics_rate_limit)])
analytics_router.add_api_route("/analytics-by-channel", handle_get_analytics_by_channel, methods=["GET"], dependencies=[Depends(require_guild_admin_query), Depends(analytics_rate_limit)])
analytics_router.add_api_route("/analytics-by-all-channels", handle_get_analytics_by_all_channels, methods=["GET"], dependencies=[Depends(require_guild_admin_query), Depends(analytics_rate_limit)])