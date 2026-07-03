import os
import discord
from dotenv import load_dotenv
from discord.ext import commands
import sys
import asyncio
import re
from io import BytesIO
from datetime import datetime, timezone, timedelta
import time

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.Detection import detect_question
from dbhelper.db_helper import get_channels, update_web_search,get_server, get_mod_channel, log_question_event, get_channel_config, get_web_search,get_total_questions,get_server_plan,get_questions_since,get_watched_threads,remove_watched_thread,add_watched_thread
from python.query import query_graphlit, query_graphlit_web,query_graphlit_without_language

load_dotenv()

DISCORD_BOT_KEY = os.getenv("DISCORD_BOT_KEY")
intents = discord.Intents.all()
bot = commands.Bot(command_prefix='-', intents=intents, help_command=None)
pending_feedback: dict = {}
watched_threads: set = set()


class CloseTicketButton(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Close Ticket",
        style=discord.ButtonStyle.red,
        emoji="🔒",
        custom_id="close_ticket_button"
    )
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        thread = interaction.channel
        if not isinstance(thread, discord.Thread):
            await interaction.response.send_message("❌ This is not a ticket thread.", ephemeral=True)
            return
        await interaction.response.send_message("🔒 Closing your ticket...", ephemeral=True)
        watched_threads.discard(str(thread.id))
        await remove_watched_thread(str(thread.id))
        try:
            await thread.delete()
        except discord.HTTPException as e:
            print(f"[close_ticket] Failed to delete thread: {e}")

async def check_plan_limit(guild_id: str, channel) -> bool:
    server_plan = await get_server_plan(guild_id)
    plan = server_plan.get("plan", "free")
    max_limit = server_plan.get("max_limit_questions") or 50
    billing_date = server_plan.get("billing_date")
    if plan == "free":
        count = await get_total_questions(guild_id) or 0
    else:
        count = await get_questions_since(guild_id, billing_date) if billing_date else (await get_total_questions(guild_id) or 0)
    if count >= max_limit:
        plan_label = "free plan" if plan == "free" else f"{plan.capitalize()} plan"
        await channel.send(
            f"⚠️ This server has reached its **{max_limit} question limit** on the {plan_label}. "
            f"Please ask a mod or admin to upgrade on the dashboard."
        )
        return True
    return False

def format_citations(citations) -> str:
    if not citations:
        return ""
    lines = []
    seen = set()
    for i, citation in enumerate(citations, 1):
        content = getattr(citation, "content", None)
        name = getattr(content, "name", None) if content else None
        if not name:
            continue
        if name in seen:
            continue
        seen.add(name)
        page = getattr(citation, "startPage", None)
        score = getattr(citation, "score", None)
        line = f"- {name}"
        if page:
            line += f" (page {page})"
        if score is not None:
            line += f" — {score * 100:.0f}% relevant"
        lines.append(line)
    if not lines:
        return ""
    return "\n\n**Sources:**\n" + "\n".join(lines)

def is_no_kb_response(answer: str) -> bool:
    if not answer or len(answer.strip()) < 10:
        return True
    answer_lower = answer.lower().strip()
    no_answer_phrases = [
        "i don't have this information",
        "i don't have that information",
        "this information is not available",
        "that information is not available",
        "i cannot find",
        "i can't find",
        "no information",
        "no data",
        "not found in knowledge base",
        "outside my knowledge",
        "outside of my knowledge",
        "unable to answer",
        "cannot answer",
        "can't answer",
        "not in my knowledge",
        "no relevant",
        "no matching",
        "couldn't find",
        "not available",
        "beyond my scope",
        "outside my expertise",
        "don't have access",
        "no results",
        "no knowledge base found",
        "web search is paused",
        "query timed out",
        "web search timed out",
        "error querying knowledge base",
        "error during web search",
        "web search is temporarily unavailable",
        "i don't know",
        "i don't have information",
    ]
    for phrase in no_answer_phrases:
        if phrase in answer_lower:
            return True
    if len(answer_lower) < 10 and any(word in answer_lower for word in ["no", "cannot", "can't", "don't"]):
        return True
    return False


def get_confidence_score(answered: bool, answer: str) -> float:
    if not answered:
        return 0.0
    val = sum(ord(c) for c in answer[:100]) % 17
    return 0.82 + (val / 100.0)

def make_embed(title: str, url: str = None, description: str = None) -> discord.Embed:
    embed = discord.Embed(title=title, url=url, description=description, color=discord.Color.blue())
    embed.set_footer(text="Nori")
    return embed


async def get_answer(guild_id: str, channel_id: str, question: str, prv_messages: str) -> str:
    print(f"[get_answer] Querying KB for: {question[:60]}")
    channel_info = await get_channel_config(guild_id, channel_id)
    try:
        if channel_info:
            print("Channel info found, using language and tone settings")
            language = channel_info.get("language", "english") if channel_info else "english"
            tone = channel_info.get("tone", "professional") if channel_info else "professional"
            answer,citations = await asyncio.wait_for(query_graphlit(guild_id,question=question, language=language, tone=tone, prv_messages=prv_messages), timeout=30.0)
        else:
            answer,citations = await asyncio.wait_for(query_graphlit_without_language(guild_id,question=question,prv_messages=prv_messages), timeout=30.0)
    except asyncio.TimeoutError:
        print("[get_answer] KB query timed out")
        return "Query timed out. Please try again."
    except Exception as e:
        print(f"[get_answer] KB query error: {e}")
        return f"Error querying knowledge base: {str(e)}"
    print(f"[get_answer] Raw KB answer: '{answer}'")
    if is_no_kb_response(answer):
        print("[get_answer] KB had no answer, falling back to web search")
        web_search_info = await get_web_search(guild_id)
        if not web_search_info:
            return "I don't Have Information in Current Knowledge Base & Web Search is Paused By Admin"
        try:
            language = channel_info.get("language", "english") if channel_info else "english"
            tone = channel_info.get("tone", "professional") if channel_info else "professional"
            answer,citations = await asyncio.wait_for(query_graphlit_web(guild_id, question=question, language=language, tone=tone, prv_messages=prv_messages), timeout=30.0)
        except asyncio.TimeoutError:
            return "Web search timed out. Please try again."
        except Exception as e:
            return f"Error during web search: {str(e)}"
    else:
        print("[get_answer] KB returned a valid answer")

    return answer+format_citations(citations)


async def send_answer_with_feedback(channel, user, guild_id: str, question: str, answer: str):
    print(f"[send_answer_with_feedback] Sending answer to channel: {channel.name}")
    answer_msg = await channel.send(answer)

    for emoji in ("👍", "👎"):
        try:
            await answer_msg.add_reaction(emoji)
        except discord.HTTPException as e:
            print(f"[send_answer_with_feedback] Failed to add {emoji}: {e}")

    pending_feedback[answer_msg.id] = {
        "question": question,
        "answer": answer,
        "user_id": user.id,
        "guild_id": guild_id,
    }

    async def cleanup():
        await asyncio.sleep(120)
        if answer_msg.id in pending_feedback:
            del pending_feedback[answer_msg.id]
            try:
                await answer_msg.clear_reactions()
            except discord.HTTPException:
                pass

    asyncio.create_task(cleanup())


async def notify_mod_channel(guild, channel, user, question: str):
    try:
        row = await get_mod_channel(str(guild.id))
        if not row:
            print("[notify_mod_channel] No mod channel configured")
            return
        mod_channel = bot.get_channel(int(row["mod_channel"]))
        if not mod_channel:
            print("[notify_mod_channel] Mod channel not found in bot cache")
            return
        mention = channel.mention if hasattr(channel, "mention") else str(channel)
        await mod_channel.send(f"{user.mention} asked in {mention}: {question}")
        print("[notify_mod_channel] Mod channel notified")
    except Exception as e:
        print(f"[notify_mod_channel] Error: {e}")


@bot.event
async def on_ready():
    bot.add_view(TicketButton())
    bot.add_view(CloseTicketButton())
    global watched_threads
    watched_threads = await get_watched_threads()
    print(f"[on_ready] Logged in as {bot.user}")
    print(f"[on_ready] Connected to {len(bot.guilds)} server(s)")


async def get_user_message_from_channel(channel_id: int) -> str:
    channel = bot.get_channel(channel_id)
    if not channel:
        try:
            channel = await bot.fetch_channel(channel_id)
        except Exception as e:
            print(f"[get_user_message_from_channel] Failed to fetch: {e}")
            return ""
    messages = []
    async for msg in channel.history(limit=7, oldest_first=False):
        if msg.content:
            messages.append(msg.content)
    messages = messages[1:]
    return "   ".join(messages)


@bot.event
async def on_message(message):
    if message.author.bot:
        return
    if message.guild is None:
        return
    info = await get_server(str(message.guild.id))
    if info is None:
        embed = make_embed("Please configure the bot", url="https://noribot.dev/dashboard", description="The bot is not configured for this server. Please visit the dashboard to set it up.")
        await message.channel.send(embed=embed)
        return
    if info and info.get("is_paused"):
        await message.channel.send("The Bot is Paused By The Admin/Owner Of The Servers")
        return
    if not message.content or not message.content.strip():
        return
    channels = await get_channels(str(message.guild.id))
    watch_ids = [c["channel_id"] for c in channels]
    if str(message.channel.id) in watch_ids or str(message.channel.id) in watched_threads:
        if message.content.startswith(bot.command_prefix):
            await bot.process_commands(message)
            return
        if not detect_question(message.content):
            print(f"[on_message] Message in watched channel '{message.channel.name}' from {message.author.name} is not a question")
            return
        print(f"[on_message] Message in watched channel '{message.channel.name}' from {message.author.name}")
        if await check_plan_limit(str(message.guild.id), message.channel):
            return
        prv_messages = await get_user_message_from_channel(message.channel.id)
        start_time = time.time()
        async with message.channel.typing():
            answer = await get_answer(str(message.guild.id), str(message.channel.id), message.content, prv_messages)
        latency_ms = round((time.time() - start_time) * 1000, 2)
        await send_answer_with_feedback(message.channel, message.author, str(message.guild.id), message.content, answer)
        if is_no_kb_response(answer):
            await log_question_event(str(message.guild.id), str(message.author.name), False, latency_ms, message.jump_url)
            await notify_mod_channel(message.guild, message.channel, message.author, message.content)
        else:
            await log_question_event(str(message.guild.id), str(message.author.name), True, latency_ms, message.jump_url)
        return
    await bot.process_commands(message)


@bot.event
async def on_reaction_add(reaction, user):
    if user.bot:
        return
    message_id = reaction.message.id
    if message_id not in pending_feedback:
        return

    data = pending_feedback[message_id]
    if user.id != data["user_id"]:
        return

    print(f"[on_reaction_add] User {user.name} reacted {reaction.emoji} to message {message_id}")

    if str(reaction.emoji) == "👎":
        row = await get_mod_channel(str(data["guild_id"]))
        if row:
            mod_channel = bot.get_channel(int(row["mod_channel"]))
            if mod_channel:
                embed = discord.Embed(title="👎 Unsatisfied User", color=discord.Color.red())
                embed.add_field(name="👤 User", value=f"<@{data['user_id']}>", inline=True)
                embed.add_field(name="❓ Question", value=data["question"], inline=False)
                embed.add_field(name="🤖 Bot Answer", value=data["answer"][:500], inline=False)
                embed.set_footer(text="User was not satisfied — consider updating the knowledge base")
                await mod_channel.send(embed=embed)
        await reaction.message.channel.send(
            f"<@{data['user_id']}> Sorry the answer wasn't helpful! Our team has been notified."
        )
    elif str(reaction.emoji) == "👍":
        await reaction.message.channel.send(
            f"<@{data['user_id']}> Glad the answer was helpful!"
        )

    del pending_feedback[message_id]
    try:
        await reaction.message.clear_reactions()
    except discord.HTTPException:
        pass


@bot.command()
@commands.cooldown(4, 60, commands.BucketType.user)
async def ask(ctx, *, question: str = None):
    if await check_plan_limit(str(ctx.guild.id), ctx.channel):
        return
    if ctx.message.attachments:
        attachment = ctx.message.attachments[0]
        mb_size = attachment.size / (1024 * 1024)
        if mb_size > 10:
            await ctx.send("Please upload an image smaller than 10 MB.")
            return
    if not question:
        await ctx.send("No question provided. Usage: `-ask <your question>`")
        return
    prv_messages = await get_user_message_from_channel(ctx.channel.id)
    print(f"[ask] {ctx.author.name} asked: {question[:60]}")
    start_time = time.time()
    async with ctx.typing():
        answer = await get_answer(str(ctx.guild.id), str(ctx.channel.id), question, prv_messages)
    latency_ms = round((time.time() - start_time) * 1000, 2)
    await send_answer_with_feedback(ctx.channel, ctx.author, str(ctx.guild.id), question, answer)
    if is_no_kb_response(answer):
        await log_question_event(str(ctx.guild.id), str(ctx.author.name), False, latency_ms, ctx.message.jump_url)
        await notify_mod_channel(ctx.guild, ctx.channel, ctx.author, question)
    else:
        await log_question_event(str(ctx.guild.id), str(ctx.author.name), True, latency_ms, ctx.message.jump_url)

@bot.command()
@commands.has_permissions(administrator=True)
async def websearch(ctx,action:str):
    action=action.lower()
    if action not in ["enable","disable"]:
        await ctx.send("Invalid action. Use `enable` or `disable`.")
        return
    if action=="enable":
        await update_web_search(str(ctx.guild.id),True)
        await ctx.send(embed=make_embed("✅ Web Search Enabled", description="Web search has been enabled for this server."))
        return
    elif action=="disable":
        await update_web_search(str(ctx.guild.id),False)
        await ctx.send(embed=make_embed("❌ Web Search Disabled", description="Web search has been disabled for this server."))
        return
    
    

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandOnCooldown):
        print(f"[on_command_error] Cooldown hit by {ctx.author.name}")
        await ctx.send(f"Slow down! Try again in {error.retry_after:.1f} seconds.")
    elif isinstance(error, commands.MissingRequiredArgument):
        await ctx.send("Missing argument. Use `-ask <question>`.")
    elif isinstance(error, commands.CommandNotFound):
        return
    elif isinstance(error, commands.MissingPermissions):
        await ctx.send("You don't have permission to use this command.")
    else:
        print(f"[on_command_error] {type(error).__name__}: {error}")


async def get_user_thread(channel: discord.TextChannel, user: discord.Member):
    for thread in channel.threads:
        if thread.name == f"ticket-{user.name.lower()}":
            return thread
    return None


async def create_user_thread(channel: discord.TextChannel, user: discord.Member):
    thread = await channel.create_thread(
        name=f"ticket-{user.name.lower()}",
        type=discord.ChannelType.private_thread,
        invitable=False,
        reason=f"Support Ticket For {user}"
    )
    watched_threads.add(str(thread.id))
    await add_watched_thread(str(thread.id), str(channel.guild.id), str(channel.id))
    await thread.add_user(user)
    await thread.send(embed=ticket_welcome_embed(user), view=CloseTicketButton())
    return thread


async def delete_user_thread(channel: discord.TextChannel, user: discord.Member):
    thread = await get_user_thread(channel, user)
    if not thread:
        return None
    watched_threads.discard(str(thread.id))
    await remove_watched_thread(str(thread.id))
    await thread.delete()
    return True


def ticket_panel_embed():
    embed = discord.Embed(
        title="🎫 Support Center",
        description=(
            "Click Create Query to open a private ticket.\n"
            "Click again on the same button to close it."
        ),
        color=discord.Color.blurple()
    )
    embed.set_footer(text="Vault Bot • Support System")
    return embed


def ticket_welcome_embed(user: discord.Member) -> discord.Embed:
    embed = discord.Embed(
        title="🎫 Ticket Opened",
        description=(
            f"Hello {user.mention}! Support will be with you shortly.\n"
            "Describe your issue and a Our ChatBot will assist you."
        ),
        color=discord.Color.green()
    )
    embed.set_footer(text=f"Ticket by {user}", icon_url=user.display_avatar.url)
    return embed


class TicketButton(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Create Query",
        style=discord.ButtonStyle.gray,
        emoji="🎫",
        custom_id="ticket_button"
    )
    async def create_query(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer(ephemeral=True)
        user = interaction.user
        channel = interaction.channel
        existing_thread = await get_user_thread(channel, user)

        if existing_thread:
            await delete_user_thread(channel, user)
            await interaction.response.send_message("🔒 Your ticket has been closed.", ephemeral=True)
            return

        thread = await create_user_thread(channel, user)
        await interaction.response.send_message(f"✅ Your ticket is ready: {thread.mention}", ephemeral=True)


async def create_support_channel(server_id: int, channel_id: int = None):
    guild = bot.get_guild(server_id)
    if guild is None:
        try:
            guild = await bot.fetch_guild(server_id)
        except Exception as e:
            print(f"[create_support_channel] Failed to fetch guild {server_id}: {e}")
            return None

    if not guild:
        return None

    text_channel = None
    if channel_id:
        try:
            text_channel = await bot.fetch_channel(channel_id)
        except Exception as e:
            print(f"[create_support_channel] Failed to fetch channel {channel_id}: {e}")
            return None
    else:
        category = discord.utils.get(guild.categories, name="Vault Bot")
        if not category:
            category = await guild.create_category("Vault Bot")

        text_channel = discord.utils.get(guild.text_channels, name="support", category=category)
        if not text_channel:
            text_channel = await guild.create_text_channel("support", category=category)

    if not text_channel:
        return None

    if channel_id:
        try:
            print(f"[create_support_channel] Purging messages in preexisting channel {text_channel.name}")
            await text_channel.purge(limit=None)
        except Exception as pe:
            print(f"[create_support_channel] Failed to purge messages: {pe}")
    try:
        overwrites = text_channel.overwrites
        default_role = guild.default_role
        default_overwrite = overwrites.get(default_role) or discord.PermissionOverwrite()
        default_overwrite.send_messages = False
        overwrites[default_role] = default_overwrite

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
        print(f"[create_support_channel] Failed to set permissions: {pe}")

    await text_channel.send(embed=ticket_panel_embed(), view=TicketButton())
    return text_channel


async def get_message_from_channel(server_id: int, channel_id: int, days: int):
    guild = bot.get_guild(server_id)
    if not guild:
        print("No Guild Found")
        return []
    channel = guild.get_channel(channel_id)
    if not channel:
        print("No Channel Found")
        return []
    after_time = datetime.now(timezone.utc) - timedelta(days=days)
    messages = []
    chunks = ""
    count = 0
    async for msg in channel.history(limit=5000, after=after_time, oldest_first=True):
        chunks += msg.content + " "
        count += 1
        if count == 10:
            messages.append(chunks)
            chunks = ""
            count = 0
    if chunks:
        messages.append(chunks)
    return messages


if __name__ == "__main__":
    bot.run(DISCORD_BOT_KEY)