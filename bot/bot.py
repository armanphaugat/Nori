import os
import discord
from dotenv import load_dotenv
from discord.ext import commands
from discord.ext.commands import cooldown, BucketType
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dbhelper.db_helper import *
from python.query import answer_query
from io import BytesIO
import re
import asyncio
import redis
from utils.apikeyrotation import *
load_dotenv()
class Buttons(discord.ui.View):
    def __init__(self, *, timeout=180):
        super().__init__(timeout=timeout)
    @discord.ui.button(label="Button",style=discord.ButtonStyle.gray)
    async def gray_button(self,button:discord.ui.Button,interaction:discord.Interaction):
        await interaction.response.edit_message(content=f"This is an edited button response!")
async def button(ctx):
    await ctx.send("This message has buttons!",view=Buttons())
os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

url_pattern = r"(https?://\S+)"
DISCORD_BOT_KEY = os.getenv("DISCORD_BOT_KEY")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='-', intents=intents, help_command=None)


pending_feedback: dict = {}

def is_no_kb_response(answer: str) -> bool:
    no_kb_phrases = [
        "i don't have this information",
        "i do not have this information",
        "not in the provided documentation",
        "not available in the provided",
    ]
    lower = answer.lower()
    return any(phrase in lower for phrase in no_kb_phrases)

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
                embed = discord.Embed(
                    title="👎 Unsatisfied User",
                    color=discord.Color.red()
                )
                embed.add_field(name="👤 User", value=f"<@{data['user_id']}>", inline=True)
                embed.add_field(name="❓ Question", value=data["question"], inline=False)
                embed.add_field(name="🤖 Bot Answer", value=data["answer"][:500], inline=False)
                embed.set_footer(text="User was not satisfied — consider updating the knowledge base")
                await mod_channel.send(embed=embed)
        await reaction.message.channel.send(
            f"<@{data['user_id']}> Sorry the answer wasn't helpful! "
            f"Our team has been notified and will assist you shortly."
        )

    elif str(reaction.emoji) == "👍":
        await reaction.message.channel.send(
            f"<@{data['user_id']}> Glad the answer was helpful!"
        )

    # Clean up tracking after feedback received
    del pending_feedback[message_id]
    try:
        await reaction.message.clear_reactions()
    except:
        pass
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
            except:
                pass

    asyncio.create_task(cleanup())
@bot.command()
@cooldown(4, 60, BucketType.user)
async def ask(ctx, *, question: str = None):
    try:
        if not question:
            await ctx.send("No Question Provided")
            return
        info = get_server(ctx.guild.id)
        if info is None:
            await ctx.send("Please Configure Bot On DashBoard")
            return
        async with ctx.typing():
            loop = asyncio.get_running_loop()
            answer = await loop.run_in_executor(
                None, answer_query, question, ctx.guild.id,
                info["system_prompt"], info["bm25_k"], info["faiss_k"]
            )
            await send_answer_with_feedback(ctx.channel, ctx.author, ctx.guild.id, question, answer)
            if is_no_kb_response(answer):
                mod_channel_row = get_mod_channel(str(ctx.guild.id))
                if mod_channel_row:
                    mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                    if mod_channel:
                        await mod_channel.send(
                            f"{ctx.author.mention} (**{ctx.author}**) asked: {question}"
                        )
                return
    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
        print(f"Error in ask command: {e}")
@bot.command()
async def help(ctx):
    embed = discord.Embed(
        title="📚 Bot Help",
        description="Here are all the available commands:",
        color=discord.Color.blurple()
    )
    embed.add_field(
        name="`-ask <question>`",
        value="Ask a question to the bot\n`-ask What is Python?`",
        inline=False
    )
    embed.set_footer(text="Ask command is limited to 4 queries per minute")
    await ctx.send(embed=embed)

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    if message.guild is None:
        return
    channels = get_channels(str(message.guild.id))
    watch_channel = [c["channel_id"] for c in channels]

    if str(message.channel.id) in watch_channel:
        info = get_server(message.guild.id)
        if info is None:
            await message.channel.send("Please Configure Bot On DashBoard")
            return
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
                return
        return
    await bot.process_commands(message)

bot.run(DISCORD_BOT_KEY)