from fastapi import HTTPException, Query

from dbhelper.db_helper import get_analytics_summary


async def handle_get_analytics_summary(guild_id: str = Query(...)) -> dict:
    if not guild_id.strip():
        raise HTTPException(status_code=400, detail="'guild_id' is required")

    try:
        summary = get_analytics_summary(guild_id)
        if not summary:
            raise HTTPException(status_code=404, detail="No analytics found for this server")
        return {"status": "success", "data": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics summary: {e}")