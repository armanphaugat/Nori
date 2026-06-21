from fastapi import APIRouter, Depends
from backend.middleware.auth import require_guild_admin_query
from backend.controllers.patreon_controller import (
    handle_patreon_checkout,
    handle_patreon_webhook,
    handle_simulate_webhook,
    handle_get_plan,
    handle_get_usage
)

patreon_router = APIRouter()

patreon_router.add_api_route("/checkout", handle_patreon_checkout, methods=["GET"])
patreon_router.add_api_route("/webhook", handle_patreon_webhook, methods=["POST"])
patreon_router.add_api_route("/simulate-webhook", handle_simulate_webhook, methods=["POST"])
patreon_router.add_api_route("/plan", handle_get_plan, methods=["GET"], dependencies=[Depends(require_guild_admin_query)])
patreon_router.add_api_route("/usage", handle_get_usage, methods=["GET"], dependencies=[Depends(require_guild_admin_query)])
