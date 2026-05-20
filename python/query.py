import os
import discord
from dotenv import load_dotenv
from discord.ext import commands
from discord.ext.commands import cooldown, BucketType
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dbhelper.db_helper import *
from python.query import *
import asyncio

load_dotenv()

os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

DISCORD_BOT_KEY = os.getenv("DISCORD_BOT_KEY")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='-', intents=intents, help_command=None)

pending_feedback: dict = {}
open_tickets: dict = {}


def is_no_kb_response(answer: str) -> bool:
    no_kb_phrases = [
        "i don't have this information",
        "i do not have this information",
        "not in the provided documentation",
        "not available in the provided",
    ]
    lower = answer.lower()
    return any(phrase in lower for phrase in no_kb_phrases)


async def send_answer_with_feedback(channel, user, guild_id, question, answer):
    answer_msg = await channel.send(answer)
    await answer_msg.add_reaction("👍")
    await answer_msg.add_reaction("👎")
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


async def get_or_create_ticket_thread(guild, support_tickets_channel, user):
    user_id = user.id
    thread_name = f"ticket-{user.name}".lower().replace(" ", "-")

    if user_id in open_tickets:
        thread = guild.get_thread(open_tickets[user_id])
        if thread and not thread.archived:
            return thread

    for thread in support_tickets_channel.threads:
        if thread.name.lower() == thread_name and not thread.archived:
            open_tickets[user_id] = thread.id
            return thread

    thread = await support_tickets_channel.create_thread(
        name=thread_name,
        type=discord.ChannelType.private_thread,
        auto_archive_duration=1440,
    )
    await thread.add_user(user)

    embed = discord.Embed(
        title="🎫 Support Ticket Opened",
        description=(
            f"Hey {user.mention}! Your support ticket is open.\n\n"
            "Just type your question here and I'll answer it.\n"
            "React 👍 if it helped or 👎 if it didn't."
        ),
        color=discord.Color.green(),
    )
    embed.set_footer(text="Thread closes after 24h of inactivity • use -close to close early")
    await thread.send(embed=embed)

    open_tickets[user_id] = thread.id
    return thread


@bot.event
async def on_guild_join(guild):
    try:
        category = await guild.create_category(name="Vault Bot")
        await guild.create_text_channel(name="support", category=category)
        await guild.create_text_channel(name="support-tickets", category=category)
    except discord.Forbidden:
        if guild.owner:
            await guild.owner.send(
                f"I joined **{guild.name}** but I don't have permission to create channels. "
                f"Please give me **Manage Channels** permission."
            )
    except Exception as e:
        print(f"Error on guild join ({guild.name}): {e}")


@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    print(f"📊 Connected to {len(bot.guilds)} server(s)")
    set_key()


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

    if str(reaction.emoji) == "👎":
        mod_channel_row = get_mod_channel(str(data["guild_id"]))
        if mod_channel_row:
            mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
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
        await reaction.message.channel.send(f"<@{data['user_id']}> Glad the answer was helpful!")

    del pending_feedback[message_id]
    try:
        await reaction.message.clear_reactions()
    except discord.HTTPException:
        pass


@bot.event
async def on_message(message):
    if message.author.bot:
        return
    if message.guild is None:
        return
    if isinstance(message.channel, discord.Thread):
        thread = message.channel
        expected_name = f"ticket-{message.author.name}".lower().replace(" ", "-")
        if thread.name.lower() == expected_name and not thread.archived:
            try:
                async with thread.typing():
                    loop = asyncio.get_running_loop()
                    answer = await query_graphlit_web(message.guild.id, question)
                await send_answer_with_feedback(thread, message.author, message.guild.id, message.content, answer)
                if is_no_kb_response(answer):
                    mod_channel_row = get_mod_channel(str(message.guild.id))
                    if mod_channel_row:
                        mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                        if mod_channel:
                            await mod_channel.send(
                                f"{message.author.mention} asked in {thread.mention}: {message.content}"
                            )
            except Exception as e:
                await thread.send(f"An error occurred: {str(e)}")
                print(f"Error in ticket thread: {e}")
            return

    if message.channel.name == "support":
        support_tickets_channel = discord.utils.get(message.guild.text_channels, name="support-tickets")
        if not support_tickets_channel:
            await message.channel.send("Could not find the `support-tickets` channel. Please contact an admin.")
            return
        try:
            thread = await get_or_create_ticket_thread(message.guild, support_tickets_channel, message.author)
        except discord.Forbidden:
            await message.channel.send("I don't have permission to create threads. Please give me **Create Private Threads** permission.")
            return
        except Exception as e:
            await message.channel.send(f"Failed to open a ticket: {e}")
            print(f"Error creating ticket: {e}")
            return
        await message.reply(f"Your support ticket is open here: {thread.mention}", delete_after=10)
        try:
            async with thread.typing():
                loop = asyncio.get_running_loop()
                answer = await query_graphlit_web(message.guild.id, question)
                if is_no_kb_response(answer):
                answer = await query_graphlit_web(ctx.guild.id, question)
            await thread.send(f"**❓ Question:** {message.content}")
            if is_no_kb_response(answer):
                answer = await query_graphlit_web(ctx.guild.id, question)
            await send_answer_with_feedback(thread, message.author, message.guild.id, message.content, answer)
            if is_no_kb_response(answer):
                mod_channel_row = get_mod_channel(str(message.guild.id))
                if mod_channel_row:
                    mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                    if mod_channel:
                        await mod_channel.send(
                            f"{message.author.mention} asked in {thread.mention}: {message.content}"
                        )
        except Exception as e:
            await thread.send(f"An error occurred: {str(e)}")
            print(f"Error answering in ticket: {e}")
        return

    channels = get_channels(str(message.guild.id))
    watch_channel = [c["channel_id"] for c in channels]

    if str(message.channel.id) in watch_channel:
        info = get_server(message.guild.id)
        if info is None:
            await message.channel.send("Please Configure Bot On DashBoard")
            return
        try:
            async with message.channel.typing():
                loop = asyncio.get_running_loop()
                answer = await loop.run_in_executor(
                    None, answer_query, message.content, message.guild.id,
                    info["system_prompt"], info["bm25_k"], info["faiss_k"]
                )
            await send_answer_with_feedback(message.channel, message.author, message.guild.id, message.content, answer)
            if is_no_kb_response(answer):
                mod_channel_row = get_mod_channel(str(message.guild.id))
                if mod_channel_row:
                    mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                    if mod_channel:
                        await mod_channel.send(
                            f"{message.author.mention} (**{message.author}**) asked: {message.content}"
                        )
        except Exception as e:
            await message.channel.send(f"An error occurred: {str(e)}")
            print(f"Error in on_message: {e}")
        return

    await bot.process_commands(message)


@bot.command()
@cooldown(4, 60, BucketType.user)
async def ask(ctx, *, question: str = None):
    try:
        if not question:
            await ctx.send("No Question Provided")
            return
        async with ctx.typing():
            answer = await query_graphlit(ctx.guild.id, question)
            if is_no_kb_response(answer):
                answer = await query_graphlit_web(ctx.guild.id, question)
        await send_answer_with_feedback(ctx.channel, ctx.author, ctx.guild.id, question, answer)
        if is_no_kb_response(answer):
            mod_channel_row = get_mod_channel(str(ctx.guild.id))
            if mod_channel_row:
                mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                if mod_channel:
                    await mod_channel.send(
                        f"{ctx.author.mention} (**{ctx.author}**) asked: {question}"
                    )
    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
        print(f"Error in ask command: {e}")


@bot.command()
async def close(ctx):
    if not isinstance(ctx.channel, discord.Thread):
        await ctx.send("This command can only be used inside a ticket thread.")
        return

    thread = ctx.channel
    is_owner = thread.name.lower() == f"ticket-{ctx.author.name}".lower().replace(" ", "-")
    is_mod = ctx.author.guild_permissions.manage_threads

    if not (is_owner or is_mod):
        await ctx.send("Only the ticket owner or a moderator can close this ticket.")
        return

    embed = discord.Embed(
        title="Ticket Closed",
        description=f"Closed by {ctx.author.mention}. This thread will now be archived.",
        color=discord.Color.red(),
    )
    await thread.send(embed=embed)
    await thread.edit(archived=True, locked=True)

    for uid, tid in list(open_tickets.items()):
        if tid == thread.id:
            del open_tickets[uid]
            break


@bot.command()
async def help(ctx):
    embed = discord.Embed(
        title="📚 Bot Help",
        description="Here are all the available commands:",
        color=discord.Color.blurple()
    )
    embed.add_field(
        name="`-ask <question>`",
        value="Ask a question in any channel.\n`-ask What is Python?`",
        inline=False
    )
    embed.add_field(
        name="`#support` channel",
        value="Send any message in `#support` to automatically open a private ticket thread and get an answer.",
        inline=False
    )
    embed.add_field(
        name="`-close`",
        value="Close and archive your ticket thread. Run inside the thread.",
        inline=False
    )
    embed.set_footer(text="-ask is limited to 4 queries/minute • Ticket threads auto-archive after 24h")
    await ctx.send(embed=embed)


bot.run(DISCORD_BOT_KEY)