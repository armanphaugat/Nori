from fastapi import HTTPException, Query

from dbhelper.db_helper import get_all_channels_unique_members, get_analytics_summary,get_recent_events,get_analytics,get_channel_unique_members


async def handle_get_analytics_summary(guild_id: str = Query(...)) -> dict:
    if not guild_id.strip():
        raise HTTPException(status_code=400, detail="'guild_id' is required")
    try:
        summary =await get_analytics_summary(guild_id)
        if not summary:
            raise HTTPException(status_code=404, detail="No analytics found for this server")
        return {"status": "success", "data": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics summary: {e}")
    
async def handle_get_recent_events(guild_id: str = Query(...),limit:int=Query(50)):
    if not guild_id.strip():
        raise HTTPException(status_code=400,detail="No Guild Id Found")
    try:
        recent_events=await get_recent_events(guild_id,limit)
        if not recent_events:
            raise HTTPException(status_code=404,detail="No Recent Event Found")
        return {"status": "success", "data": recent_events}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Recent Analytics {e}")
    
async def handle_get_all_analytics(guild_id: str = Query(...),limit:int=Query(30)):
    if not guild_id.strip():
        raise HTTPException(status_code=400,detail="No Guild Id Found")
    try:
        analytics=await get_analytics(guild_id,limit)
        if not analytics:
            raise HTTPException(status_code=404,detail="No Analytics Found")
        return {"status": "success", "data": analytics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {e}{e}")
    
async def handle_get_analytics_by_channel(channel_id: str = Query(...), limit: int = Query(50)):
    if not channel_id.strip():
        raise HTTPException(status_code=400, detail="No Channel Id Found")
    try:
        analytics = await get_channel_unique_members(channel_id)
        if not analytics:
            raise HTTPException(status_code=404, detail="No Analytics Found for this channel")
        return {"status": "success", "data": analytics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {e}")
    
async def handle_get_analytics_by_all_channels(guild_id: str = Query(...), limit: int = Query(50)):
    if not guild_id.strip():
        raise HTTPException(status_code=400, detail="No Guild Id Found")
    try:
        analytics = await get_all_channels_unique_members(guild_id)
        if not analytics:
            raise HTTPException(status_code=404, detail="No Analytics Found for this guild")
        return {"status": "success", "data": analytics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {e}")