from typing import List, Optional

from fastapi import Form, HTTPException
from backend.middleware.auth import *
from dbhelper.db_helper import delete_channel_knowledge_source, delete_all_channel_knowledge_sources, delete_mod_channel,delete_channel_config, get_all_channel_knowledge_sources, get_channel_knowledge_sources, insert_channel_knowledge_source,update_channel_config,insert_mod_channel,get_channel_config, remove_channel, set_channel,insert_channel_config,get_all_channel_configs


async def handle_add_channel(
    guild_id:   str  = Form(...),
    channel_id: List = Form(...),
) -> dict:
    try:
        for channel in channel_id:
            await set_channel(guild_id, channel)
        return {"status": "success", "message": "Channel(s) added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add channel: {e}")


async def handle_delete_channel(
    guild_id:   str = Form(...),
    channel_id: str = Form(...),
) -> dict:
    try:
        await remove_channel(guild_id, channel_id)
        return {"status": "success", "message": "Channel deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete channel: {e}")


async def handle_add_mod_channel(
    guild_id:   str = Form(...),
    channel_id: str = Form(...),
) -> dict:
    try:
        await insert_mod_channel(guild_id, channel_id)
        return {"status": "success", "message": "Mod channel added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add mod channel: {e}")
    
async def handle_get_channels(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),   # already imported via middleware.auth *
) -> dict:
    from dbhelper.db_helper import get_channels
    from dbhelper.db_helper import get_mod_channel
    try:
        channels    = await get_channels(guild_id)        # list of {"channel_id": "..."}
        mod_row     = await get_mod_channel(guild_id)     # {"mod_channel": "..." | None}
        return {
            "status":      "success",
            "channel_ids": [c["channel_id"] for c in channels],
            "mod_channel": mod_row["mod_channel"] if mod_row else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get channels: {e}")
    
async def handle_add_support_channel(
    guild_id: str = Form(...),
    channel_id: Optional[str] = Form(None),
    user: dict = Depends(require_guild_admin),
) -> dict:
    from discord.ext import commands
    commands.Bot.run = lambda *args, **kwargs: None
    from bot.bot import bot, create_support_channel
    import os
    import discord

    try:
        guild_id_int = int(guild_id)
        channel_id_int = int(channel_id) if channel_id else None
        if not bot.http.token:
            bot_token = os.getenv("DISCORD_BOT_KEY")
            if not bot_token:
                raise HTTPException(status_code=500, detail="DISCORD_BOT_KEY not found in environment")
            await bot.login(bot_token)
        guild = await bot.fetch_guild(guild_id_int)
        bot._connection._add_guild(guild)
        channels = await guild.fetch_channels()
        for chan in channels:
            guild._add_channel(chan)
        if not channel_id_int:
            category = discord.utils.get(guild.categories, name="Vault Bot")
            text_channel = None
            if category:
                text_channel = discord.utils.get(
                    guild.text_channels, name="support", category=category
                )

            if category and text_channel:
                try:
                    overwrites = text_channel.overwrites
                    default_overwrite = overwrites.get(guild.default_role) or discord.PermissionOverwrite()
                    default_overwrite.send_messages = False
                    overwrites[guild.default_role] = default_overwrite

                    me = None
                    if bot.user:
                        try:
                            me = await guild.fetch_member(bot.user.id)
                        except Exception:
                            me = getattr(guild, "me", None)

                    if me:
                        bot_overwrite = overwrites.get(me) or discord.PermissionOverwrite()
                        bot_overwrite.send_messages = True
                        bot_overwrite.read_messages = True
                        bot_overwrite.manage_threads = True
                        bot_overwrite.create_public_threads = True
                        bot_overwrite.create_private_threads = True
                        bot_overwrite.send_messages_in_threads = True
                        overwrites[me] = bot_overwrite

                    await text_channel.edit(overwrites=overwrites)
                except Exception as pe:
                    print(f"[handle_add_support_channel] Failed to update permissions for existing support channel: {pe}")

                return {
                    "status": "success",
                    "message": "Category Channel Created"
                }
        result = await create_support_channel(guild_id_int, channel_id_int)
        if result:
            return {
                "status": "success",
                "message": "Category Channel Created"
            }
        else:
            return {
                "status": "Failed",
                "message": "Unable to Add Category Channel"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure support channel: {e}")
    
async def handle_add_channel_config(guild_id: str = Form(...),channel_id:str = Form(...),language: str =Form(default="english"),tone: str = Form(default="professional"),user: dict = Depends(require_guild_admin),) -> dict:
    try:
        result=await insert_channel_config(guild_id,channel_id,language,tone)
        if result:
            return {
                "status": "success",
                "message": "Channel Added For Language & Tone"
            }
        else:
            return {
                "status": "Failed",
                "message": "Unable to Add For Language & Tone"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure Language & Tone{e}")
    
async def handle_update_channel_config(guild_id: str = Form(...),channel_id: str = Form(...),language: str = Form(default=None),tone: str = Form(default=None),user: dict = Depends(require_guild_admin),) -> dict:
    try:
        result = await update_channel_config(guild_id, channel_id, language, tone)
        if result:
            return {
                "status": "success",
                "message": "Channel config updated successfully"
            }
        else:
            return {
                "status": "failed",
                "message": "Unable to update channel config"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update channel config: {e}")
async def handle_delete_channel_config(guild_id: str = Form(...),channel_id: str = Form(...),user: dict = Depends(require_guild_admin),) -> dict:
    try:
        result = await delete_channel_config(guild_id, channel_id)
        if result:
            return {
                "status": "success",
                "message": "Channel config deleted successfully"
            }
        else:
            return {
                "status": "failed",
                "message": "Unable to delete channel config"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete channel config: {e}")
    
async def handle_get_all_channel_configs(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> dict:
    try:
        result = await get_all_channel_configs(guild_id)
        if result:
            return {
                "status": "success",
                "total": len(result),
                "data": result
            }
        else:
            return {
                "status": "success",
                "total": 0,
                "message": "No channels configured for this guild",
                "data": []
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get channel list: {e}")
    
async def handle_delete_mod_channel(
    guild_id: str = Form(...),
    channel_id: str = Form(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    try:
        await delete_mod_channel(guild_id,channel_id)
        return {"status": "success", "message": "Mod channel deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete mod channel: {e}")
    
async def handle_add_channel_specific_knowledge_base(
    guild_id: str = Form(...),
    channel_id: str = Form(...),
    content_id: List[str] = Form(...),
    feed_id: List[str] = Form(...),
    user: dict = Depends(require_guild_admin),
):
    try:
        inserted_ids = []

        for cid in content_id:
            if cid:
                new_id = await insert_channel_knowledge_source(
                    server_id=guild_id,
                    channel_id=channel_id,
                    content_id=cid,
                    feed_id=None,
                )
                inserted_ids.append(new_id)

        for fid in feed_id:
            if fid:
                new_id = await insert_channel_knowledge_source(
                    server_id=guild_id,
                    channel_id=channel_id,
                    content_id=None,
                    feed_id=fid,
                )
                inserted_ids.append(new_id)
        return {"inserted": inserted_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add channel knowledge sources: {e}")

async def handle_get_channel_specific_knowledge_base(
    guild_id: str = Query(...),
    channel_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
):
    try:
        sources = await get_channel_knowledge_sources(guild_id, channel_id)
        return {
            "status": "success",
            "total": len(sources),
            "data": sources,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get channel knowledge sources: {e}")
    
async def handle_delete_channel_specific_knowledge_base(
    guild_id: str = Form(...),
    channel_id: str = Form(...),
    source_id: str = Form(...),
    user: dict = Depends(require_guild_admin),
):
    try:
        rowcount = await delete_channel_knowledge_source(source_id)
        if rowcount == 0:
            raise HTTPException(status_code=404, detail="Knowledge source not found")
        return {"status": "success", "message": "Channel knowledge source deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete channel knowledge source: {e}")

async def handle_delete_all_channel_specific_knowledge_base(
    guild_id: str = Form(...),
    channel_id: str = Form(...),
    user: dict = Depends(require_guild_admin),
):
    try:
        rowcount = await delete_all_channel_knowledge_sources(guild_id, channel_id)
        return {"status": "success", "message": "All channel knowledge sources deleted successfully", "deleted": rowcount}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete all channel knowledge sources: {e}")
    

async def handle_list_all_channel_knowledge_base(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
):
    try:
        rows = await get_all_channel_knowledge_sources(server_id=guild_id)
        return {"status": "success", "data": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list channel knowledge sources: {e}")