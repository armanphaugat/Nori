import os
import discord
from dotenv import load_dotenv
from discord.ext import commands
from discord.ext.commands import cooldown,BucketType
from dbhelper import get_channels,get_mod_channel
import sys
from io import BytesIO
import re
import asyncio
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__))))

from ingest import webscraper, split_texts, create_vectorstore, read_pdf
from query import answer_query
os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

url_pattern = r"(https?://\S+)"

load_dotenv()
DISCORD_BOT_KEY = os.getenv("DISCORD_BOT_KEY")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='-', intents=intents, help_command=None)

@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    print(f"📊 Connected to {len(bot.guilds)} server(s)")

@bot.command()
@cooldown(4, 60, BucketType.user)
async def ask(ctx, *, question: str = None):
    try:
        if not question:
            await ctx.send("No Question Provided")
            return
        
        async with ctx.typing():
            loop = asyncio.get_running_loop()
            answer = await loop.run_in_executor(None, answer_query, question, ctx.guild.id)
            if answer is None:
                await ctx.send("I couldn't find an answer to your question.")
                mod_channel_row=get_mod_channel(str(ctx.guild.id))
                if mod_channel_row:
                    mod_channel = bot.get_channel(int(mod_channel_row["channel_id"]))
                    if mod_channel:               
                        await mod_channel.send(f"{ctx.author.mention} (**{ctx.author}**) asked: {question}")
                return
            await ctx.send(answer)
            
    except Exception as e:
        await ctx.send(f"❌ An error occurred: {str(e)}")
        print(f"Error in ask command: {e}")

@bot.command()
async def help(ctx):
    embed = discord.Embed(
        title="📚 Bot Help",
        description="Here are all the available commands:",
        color=discord.Color.blurple()
    )

    embed.add_field(
        name="❓ `-ask <question>`",
        value="Ask a question to the bot\n`!ask What is Python?`",
        inline=False
    )
    embed.set_footer(text="Ask command is limited to 4 queries per minute")
    await ctx.send(embed=embed)

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    channels=get_channels(str(message.guild.id))
    result_channel=[]
    for c in channels:
        result_channel.append(c["mod_channel"])
    if str(message.channel.id) in result_channel:
        async with message.channel.typing():
            loop=asyncio.get_running_loop()
            answer = await loop.run_in_executor(None, answer_query, message.content, message.guild.id)
            if answer is None:
                await message.channel.send("I couldn't find an answer to your question.")
                mod_channel_row=get_mod_channel(str(message.guild.id))
                if mod_channel_row:
                    mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
                    if mod_channel:               
                        await mod_channel.send(f"{message.author.mention} (**{message.author}**) asked: {message.content}")
                return
            await message.reply(answer)
        return 
    await bot.process_commands(message)

bot.run(DISCORD_BOT_KEY)