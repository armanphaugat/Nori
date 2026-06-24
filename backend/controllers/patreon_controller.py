import os
import hashlib
import hmac
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, Query, Form, Request
from fastapi.responses import RedirectResponse
from backend.middleware.auth import require_guild_admin_query
from dbhelper.db_helper import (
    get_server_plan,
    update_server_plan_status,
    get_servers_by_admin,
    get_admin_by_email,
    get_questions_since,
    get_total_questions,
    PLAN_LIMITS
)

PATREON_CAMPAIGN_URL = os.getenv("PATREON_CAMPAIGN_URL", "https://www.patreon.com/VaultBotBilling")
PATREON_WEBHOOK_SECRET = os.getenv("PATREON_WEBHOOK_SECRET", "")


async def handle_patreon_checkout(
    guild_id: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
) -> RedirectResponse:
    """
    Redirects the user to the Patreon campaign/checkout page or specific plan checkout URL.
    """
    if plan:
        env_var = f"PATREON_CHECKOUT_{plan.upper()}_URL"
        checkout_url = os.getenv(env_var)
        if checkout_url:
            return RedirectResponse(url=checkout_url)
    return RedirectResponse(url=PATREON_CAMPAIGN_URL)


async def handle_patreon_webhook(request: Request) -> dict:
    """
    Patreon Webhook receiver endpoint.
    Listens for member events (create, update, delete) and updates server plan status.
    """
    body = await request.body()
    
    # Optional signature verification
    if PATREON_WEBHOOK_SECRET:
        signature = request.headers.get("X-Patreon-Signature")
        if not signature:
            raise HTTPException(status_code=401, detail="Missing webhook signature header")
        
        expected_sig = hmac.new(
            PATREON_WEBHOOK_SECRET.encode(),
            body,
            hashlib.md5
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Parse JSON payload
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = request.headers.get("X-Patreon-Event", "members:update")
    
    data = payload.get("data", {})
    attributes = data.get("attributes", {})
    patron_status = attributes.get("patron_status")  # e.g., "active_patron", "declined_patron", "former_patron"
    email = attributes.get("email")

    # Search in included relationships for connected Discord accounts
    discord_id = None
    for item in payload.get("included", []):
        if item.get("type") == "user":
            socials = item.get("attributes", {}).get("social_connections", {})
            discord_conn = socials.get("discord") if socials else None
            if discord_conn:
                discord_id = discord_conn.get("user_id")
            if not email:
                email = item.get("attributes", {}).get("email")

    # Extract entitled tier IDs
    entitled_tier_ids = []
    currently_entitled_tiers = data.get("relationships", {}).get("currently_entitled_tiers", {})
    tier_data = currently_entitled_tiers.get("data")
    if isinstance(tier_data, list):
        entitled_tier_ids = [t.get("id") for t in tier_data if t.get("type") == "tier"]
    elif isinstance(tier_data, dict):
        entitled_tier_ids = [tier_data.get("id")]

    # Find matching tier titles from the "included" objects
    tier_titles = []
    for item in payload.get("included", []):
        if item.get("type") == "tier" and item.get("id") in entitled_tier_ids:
            title = item.get("attributes", {}).get("title", "")
            if title:
                tier_titles.append(title.lower())

    # Match the pledge to our admin users in the database
    admin_discord_id = None
    if discord_id:
        admin_discord_id = discord_id
    elif email:
        admin_discord_id = await get_admin_by_email(email)

    if not admin_discord_id:
        print(f"[Patreon Webhook] No matching admin user found for email={email}, discord_id={discord_id}")
        return {"status": "ignored", "reason": "user_not_found"}

    # Resolve servers managed by this user
    servers = await get_servers_by_admin(admin_discord_id)
    if not servers:
        print(f"[Patreon Webhook] Admin user {admin_discord_id} has no servers registered in dashboard")
        return {"status": "ignored", "reason": "no_servers"}

    # Determine next plan state based on event, status, and entitled tiers
    is_active = (
        event != "members:pledge:delete" 
        and patron_status == "active_patron"
    )

    next_plan = "free"
    if is_active:
        next_plan = "paid"  # Default fallback premium
        for title in tier_titles:
            if "enterprise" in title:
                next_plan = "enterprise"
                break
            elif "pro" in title:
                next_plan = "pro"
                break
            elif "growth" in title:
                next_plan = "growth"
                break
            elif "starter" in title:
                next_plan = "starter"
                break

    # Upgrade/downgrade all servers managed by this admin user
    limit = PLAN_LIMITS.get(next_plan, 50)
    patron_user_id = data.get("relationships", {}).get("patron", {}).get("data", {}).get("id")

    updated_servers = []
    for server_id in servers:
        existing = await get_server_plan(server_id)
        if existing and existing.get("custom_limit"):
            print(f"[Patreon Webhook] Skipping {server_id} — custom limit set")
            continue  # don't overwrite
        await update_server_plan_status(server_id, next_plan, limit, patron_user_id, email)
        updated_servers.append(server_id)

    print(f"[Patreon Webhook] Updated servers {updated_servers} plan to '{next_plan}' (limit: {limit}, email: {email})")

    return {
        "status": "success",
        "patron_email": email,
        "admin_discord_id": admin_discord_id,
        "is_active": is_active,
        "plan_applied": next_plan,
        "servers_updated": updated_servers
    }


async def handle_simulate_webhook(
    discord_id: Optional[str] = Form(default=None),
    email: Optional[str] = Form(default=None),
    status: str = Form(...),  # e.g., "active_patron", "inactive", "starter", "growth", "pro", "paid"
    plan: Optional[str] = Form(default=None)
) -> dict:
    """
    Mock endpoint to test the Patreon webhook behavior locally.
    Resolves servers for the specified Discord ID or Email and updates their plan.
    """
    resolved_discord_id = None
    if discord_id:
        resolved_discord_id = discord_id
    elif email:
        resolved_discord_id = await get_admin_by_email(email)

    if not resolved_discord_id:
        raise HTTPException(status_code=404, detail="No matching admin user found in database")

    servers = await get_servers_by_admin(resolved_discord_id)
    if not servers:
        return {"status": "no_servers_found", "discord_id": resolved_discord_id}

    is_active = status in ["active_patron", "active"] or status in PLAN_LIMITS or (plan and plan in PLAN_LIMITS)
    
    if plan and plan in PLAN_LIMITS:
        next_plan = plan
    elif status in PLAN_LIMITS:
        next_plan = status
    else:
        next_plan = "paid" if is_active else "free"

    limit = PLAN_LIMITS.get(next_plan, 50)

    updated = []
    for server_id in servers:
        existing = await get_server_plan(server_id)
        if existing and existing.get("custom_limit"):
            continue
        await update_server_plan_status(server_id, next_plan, limit, None, email)
        updated.append(server_id)

    return {
        "status": "success",
        "resolved_discord_id": resolved_discord_id,
        "plan_applied": next_plan,
        "max_limit_applied": limit,
        "servers_updated": updated
    }


async def handle_get_plan(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> dict:
    """
    Fetch active plan name and limit details for a specific server.
    """
    plan_info = await get_server_plan(guild_id)
    if not plan_info:
        return {
            "server_id": guild_id,
            "plan": "free",
            "max_limit_questions": 50
        }
    
    billing_date = plan_info.get("billing_date")
    if isinstance(billing_date, datetime):
        billing_date = billing_date.isoformat()

    return {
        "server_id": plan_info["server_id"],
        "plan": plan_info["plan"],
        "max_limit_questions": plan_info["max_limit_questions"],
        "billing_date": billing_date,
    }


async def handle_get_usage(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> dict:
    """
    Retrieve message/question limits and current period usage.
    """
    plan_info = await get_server_plan(guild_id)
    billing_date = plan_info.get("billing_date") if plan_info else None
    
    if billing_date:
        asked_count = await get_questions_since(guild_id, billing_date)
    else:
        asked_count = await get_total_questions(guild_id) or 0
        
    return {
        "guild_id": guild_id,
        "questions_asked": asked_count,
        "max_limit_questions": plan_info["max_limit_questions"] if plan_info else 50,
    }
