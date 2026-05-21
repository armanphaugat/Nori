import os
import discord
from dotenv import load_dotenv
from discord.ext import commands
from discord.ui import Button, View
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dbhelper.db_helper import get_channels, get_server, get_mod_channel
from python.query import query_graphlit, query_graphlit_web
import asyncio

load_dotenv()

os.environ["USER_AGENT"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

DISCORD_BOT_KEY = os.getenv("DISCORD_BOT_KEY")
intents = discord.Intents.all()
bot = commands.Bot(command_prefix='-', intents=intents, help_command=None)

pending_feedback: dict = {}
open_tickets: dict = {}
ticket_lock = asyncio.Lock()


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
    """Send answer with emoji reactions for feedback."""
    try:
        # Send the answer
        answer_msg = await channel.send(answer)
        
        # Add reactions with proper error handling
        try:
            await answer_msg.add_reaction("👍")
        except discord.HTTPException as e:
            print(f"[send_answer_with_feedback] Failed to add 👍 reaction: {e}")
        
        try:
            await answer_msg.add_reaction("👎")
        except discord.HTTPException as e:
            print(f"[send_answer_with_feedback] Failed to add 👎 reaction: {e}")
        
        # Store feedback data
        pending_feedback[answer_msg.id] = {
            "question": question,
            "answer": answer,
            "user_id": user.id,
            "guild_id": guild_id,
        }

        # Cleanup after 2 minutes
        async def cleanup():
            await asyncio.sleep(120)
            if answer_msg.id in pending_feedback:
                del pending_feedback[answer_msg.id]
                try:
                    await answer_msg.clear_reactions()
                except discord.HTTPException:
                    pass

        asyncio.create_task(cleanup())
    except Exception as e:
        print(f"[send_answer_with_feedback] Error: {e}")
        await channel.send(f"Failed to send answer: {str(e)}")


async def notify_mod_channel(guild, thread_or_channel, user, question):
    """Send unanswered question alert to mod channel."""
    try:
        mod_channel_row = get_mod_channel(str(guild.id))
        if not mod_channel_row:
            return
        mod_channel = bot.get_channel(int(mod_channel_row["mod_channel"]))
        if not mod_channel:
            return
        mention = thread_or_channel.mention if hasattr(thread_or_channel, "mention") else ""
        await mod_channel.send(
            f"{user.mention} asked in {mention}: {question}"
        )
    except Exception as e:
        print(f"[notify_mod_channel] Error: {e}")


# ============================================================================
# BUTTON SYSTEM FOR TICKET CREATION
# ============================================================================

class SupportTicketView(discord.ui.View):
    """View with button to create a support ticket."""
    
    def __init__(self, guild_id: str, *, timeout=None):
        super().__init__(timeout=timeout)
        self.guild_id = guild_id
    
    @discord.ui.button(
        label="🎫 Open Support Ticket",
        style=discord.ButtonStyle.blurple,
        emoji="🎫"
    )
    async def create_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle ticket creation when button is clicked."""
        try:
            # Defer the interaction
            await interaction.response.defer(ephemeral=True)
            
            guild = bot.get_guild(int(self.guild_id))
            if not guild:
                await interaction.followup.send(
                    "❌ Guild not found.",
                    ephemeral=True
                )
                return
            
            # Get the support-tickets channel
            support_tickets_channel = discord.utils.get(
                guild.text_channels, name="support-tickets"
            )
            if not support_tickets_channel:
                await interaction.followup.send(
                    "❌ Support tickets channel not found. Please contact an admin.",
                    ephemeral=True
                )
                return
            
            # Create ticket thread
            user = interaction.user
            thread_name = f"ticket-{user.name}".lower().replace(" ", "-")
            
            async with ticket_lock:
                # Check if user already has an open ticket
                if user.id in open_tickets:
                    existing_thread = guild.get_thread(open_tickets[user.id])
                    if existing_thread and not existing_thread.archived:
                        await interaction.followup.send(
                            f"✅ You already have an open ticket: {existing_thread.mention}",
                            ephemeral=True
                        )
                        return
                
                # Check for existing thread with same name
                for thread in support_tickets_channel.threads:
                    if thread.name.lower() == thread_name and not thread.archived:
                        open_tickets[user.id] = thread.id
                        await interaction.followup.send(
                            f"✅ Found your existing ticket: {thread.mention}",
                            ephemeral=True
                        )
                        return
                
                # Create new thread
                thread = await support_tickets_channel.create_thread(
                    name=thread_name,
                    type=discord.ChannelType.private_thread,
                    auto_archive_duration=1440,
                )
                await thread.add_user(user)
                
                # Send welcome message in thread
                welcome_embed = discord.Embed(
                    title="🎫 Support Ticket Opened",
                    description=(
                        f"Hello {user.mention}! Your support ticket is now open.\n\n"
                        "**Type your question below** and I'll do my best to help!"
                    ),
                    color=discord.Color.green(),
                )
                welcome_embed.add_field(
                    name="📋 What happens next:",
                    value=(
                        "1. Send your question\n"
                        "2. I'll search our knowledge base\n"
                        "3. React 👍 if helpful or 👎 if not\n"
                        "4. Your feedback helps us improve!"
                    ),
                    inline=False
                )
                welcome_embed.add_field(
                    name="⏱️ Thread info:",
                    value=(
                        "• This thread is private (only you & mods see it)\n"
                        "• Auto-closes after 24 hours of inactivity\n"
                        "• Use `-close` to close it early"
                    ),
                    inline=False
                )
                welcome_embed.set_footer(text="Powered by AI Knowledge Base")
                await thread.send(embed=welcome_embed)
                
                open_tickets[user.id] = thread.id
                
                # Send confirmation to user
                await interaction.followup.send(
                    f"✅ Your support ticket is ready! Go to {thread.mention} to ask your question.",
                    ephemeral=True
                )
                
        except discord.Forbidden as e:
            await interaction.followup.send(
                "❌ I don't have permission to create threads. "
                "Please contact an admin to fix this.",
                ephemeral=True
            )
            print(f"[Forbidden] {e}")
        except Exception as e:
            print(f"[Error in create_ticket] {e}")
            await interaction.followup.send(
                f"❌ Error creating ticket: {str(e)}",
                ephemeral=True
            )


class QuickAnswerView(discord.ui.View):
    """View with button to ask a quick question without opening a full ticket."""
    
    def __init__(self, guild_id: str, *, timeout=None):
        super().__init__(timeout=timeout)
        self.guild_id = guild_id
    
    @discord.ui.button(
        label="⚡ Quick Answer",
        style=discord.ButtonStyle.green,
        emoji="⚡"
    )
    async def quick_answer(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle quick answer modal."""
        try:
            # Show a modal for user to input their question
            await interaction.response.send_modal(QuestionModal(self.guild_id))
        except Exception as e:
            print(f"[Error in quick_answer] {e}")
            await interaction.response.send_message(
                f"❌ Error: {str(e)}",
                ephemeral=True
            )


class QuestionModal(discord.ui.Modal, title="Ask a Question"):
    """Modal for asking a quick question."""
    
    question_input = discord.ui.TextInput(
        label="Your Question",
        placeholder="What would you like to know?",
        required=True,
        min_length=3,
        max_length=1000,
        style=discord.TextStyle.paragraph
    )
    
    def __init__(self, guild_id: str):
        super().__init__()
        self.guild_id = guild_id
    
    async def on_submit(self, interaction: discord.Interaction):
        """Process the submitted question."""
        try:
            await interaction.response.defer(ephemeral=False)
            
            question = str(self.question_input)
            guild_id = self.guild_id
            
            # Show loading message
            loading_msg = await interaction.followup.send(
                "🔍 Searching knowledge base...",
                ephemeral=False
            )
            
            # Query the knowledge base
            try:
                answer = await asyncio.wait_for(
                    query_graphlit(guild_id, question),
                    timeout=30.0
                )
            except asyncio.TimeoutError:
                answer = "Query timed out. Please try again."
            except Exception as e:
                print(f"[QuestionModal] query_graphlit error: {e}")
                answer = f"Error querying knowledge base: {str(e)}"
            
            # If KB response is empty, try web search
            if is_no_kb_response(answer):
                try:
                    web_answer = await asyncio.wait_for(
                        query_graphlit_web(guild_id, question),
                        timeout=30.0
                    )
                    answer = web_answer
                except asyncio.TimeoutError:
                    answer = "Web search timed out. Please try again."
                except Exception as e:
                    print(f"[QuestionModal] query_graphlit_web error: {e}")
            
            # Delete loading message
            try:
                await loading_msg.delete()
            except:
                pass
            
            # Create a nice embed for the answer
            answer_embed = discord.Embed(
                title="📚 Answer",
                description=answer[:2000],  # Limit to 2000 chars
                color=discord.Color.blurple()
            )
            answer_embed.add_field(
                name="📝 Your Question",
                value=question[:1024],  # Embed field limit
                inline=False
            )
            answer_embed.set_footer(text="React 👍 or 👎 to rate this answer")
            
            # Send answer with feedback reactions
            answer_msg = await interaction.followup.send(
                embed=answer_embed,
                ephemeral=False
            )
            
            # Add reactions for feedback with error handling
            try:
                await answer_msg.add_reaction("👍")
            except discord.HTTPException as e:
                print(f"[QuestionModal] Failed to add 👍 reaction: {e}")
            
            try:
                await answer_msg.add_reaction("👎")
            except discord.HTTPException as e:
                print(f"[QuestionModal] Failed to add 👎 reaction: {e}")
            
            # Store feedback data
            pending_feedback[answer_msg.id] = {
                "question": question,
                "answer": answer,
                "user_id": interaction.user.id,
                "guild_id": guild_id,
            }
            
            # Notify mods if no good answer found
            if is_no_kb_response(answer):
                await notify_mod_channel(
                    interaction.guild, 
                    interaction.channel, 
                    interaction.user, 
                    question
                )
            
        except Exception as e:
            print(f"[Error in QuestionModal.on_submit] {e}")
            try:
                await interaction.followup.send(
                    f"❌ Error processing your question: {str(e)}",
                    ephemeral=True
                )
            except:
                pass


async def setup_support_channels(guild):
    """Create support channels with welcome messages and buttons."""
    try:
        # Create category
        category = await guild.create_category(
            name="🆘 Support System",
            reason="Support ticket system setup"
        )
        
        # Create main support channel
        support_channel = await guild.create_text_channel(
            name="support",
            category=category,
            topic="Click the button below to open a support ticket or ask a quick question",
            reason="Support ticket creation channel"
        )
        
        # Create support tickets channel (where threads will be created)
        support_tickets_channel = await guild.create_text_channel(
            name="support-tickets",
            category=category,
            topic="Private support ticket threads are created here",
            reason="Support ticket threads channel"
        )
        
        # Send welcome message with buttons to support channel
        welcome_embed = discord.Embed(
            title="🎫 Welcome to Support",
            description=(
                "Need help? Choose one of the options below!\n\n"
                "**🎫 Open Support Ticket** - Start a private conversation\n"
                "**⚡ Quick Answer** - Ask a quick question instantly"
            ),
            color=discord.Color.blurple()
        )
        welcome_embed.add_field(
            name="📝 What to expect:",
            value=(
                "🔍 I search our knowledge base for answers\n"
                "📞 Moderators can join if needed\n"
                "⭐ Your feedback helps us improve"
            ),
            inline=False
        )
        welcome_embed.add_field(
            name="💡 Available Commands:",
            value=(
                "`-ask <question>` - Ask anywhere with rate limit\n"
                "`-close` - Close your ticket (in thread)\n"
                "`-help` - Show all commands"
            ),
            inline=False
        )
        welcome_embed.set_footer(text="Click a button below to get started!")
        welcome_embed.set_thumbnail(url=guild.icon.url if guild.icon else "")
        
        # Create view with both buttons
        view = SupportTicketView(str(guild.id))
        view.add_item(QuickAnswerView(str(guild.id)).children[0])
        
        await support_channel.send(embed=welcome_embed, view=view)
        
        # Send info message to support-tickets channel
        info_embed = discord.Embed(
            title="🔒 Private Support Tickets",
            description=(
                "This channel contains **private** support ticket threads.\n"
                "Only you and moderators can see your ticket."
            ),
            color=discord.Color.green()
        )
        info_embed.add_field(
            name="✅ In this channel:",
            value=(
                "• Your ticket thread stays private\n"
                "• Only you and mods can view it\n"
                "• Auto-archives after 24h of inactivity\n"
                "• Use `-close` to end early"
            ),
            inline=False
        )
        await support_tickets_channel.send(embed=info_embed)
        
        return True
        
    except discord.Forbidden as e:
        print(f"[setup_support_channels] Permission error: {e}")
        return False
    except Exception as e:
        print(f"[setup_support_channels] Error: {e}")
        return False


async def get_or_create_ticket_thread(guild, support_tickets_channel, user):
    """Get or create a support ticket thread (thread-safe)."""
    user_id = user.id
    thread_name = f"ticket-{user.name}".lower().replace(" ", "-")

    async with ticket_lock:
        # Check cache first
        if user_id in open_tickets:
            thread = guild.get_thread(open_tickets[user_id])
            if thread and not thread.archived:
                return thread
        
        # Search for existing thread
        for thread in support_tickets_channel.threads:
            if thread.name.lower() == thread_name and not thread.archived:
                open_tickets[user_id] = thread.id
                return thread

        # Create new thread
        thread = await support_tickets_channel.create_thread(
            name=thread_name,
            type=discord.ChannelType.private_thread,
            auto_archive_duration=1440,
        )
        await thread.add_user(user)

        # Send welcome embed to ticket thread
        embed = discord.Embed(
            title="🎫 Support Ticket Opened",
            description=(
                f"Hello {user.mention}! Your support ticket is now open.\n\n"
                "**Type your question below** and I'll do my best to help!"
            ),
            color=discord.Color.green(),
        )
        embed.add_field(
            name="📋 What happens next:",
            value=(
                "1. Send your question\n"
                "2. I'll search our knowledge base\n"
                "3. React 👍 if helpful or 👎 if not\n"
                "4. Your feedback helps us improve!"
            ),
            inline=False
        )
        embed.add_field(
            name="⏱️ Thread info:",
            value=(
                "• This thread is private (only you & mods see it)\n"
                "• Auto-closes after 24 hours of inactivity\n"
                "• Use `-close` to close it early"
            ),
            inline=False
        )
        embed.set_footer(text="Powered by AI Knowledge Base")
        await thread.send(embed=embed)

        open_tickets[user_id] = thread.id
        return thread


@bot.event
async def on_guild_join(guild):
    """Setup support system when bot joins a new guild."""
    try:
        print(f"[on_guild_join] Bot joined {guild.name}")
        
        success = await setup_support_channels(guild)
        
        if success:
            if guild.owner:
                owner_embed = discord.Embed(
                    title="✅ Support System Activated",
                    description=f"I've successfully set up the support system in **{guild.name}**!",
                    color=discord.Color.green()
                )
                owner_embed.add_field(
                    name="📍 Created channels:",
                    value=(
                        "• `#support` - Where users click buttons to get help\n"
                        "• `#support-tickets` - Where private threads are created"
                    ),
                    inline=False
                )
                owner_embed.add_field(
                    name="🚀 Quick start:",
                    value=(
                        "1. Go to `#support` channel\n"
                        "2. Click **🎫 Open Support Ticket** or **⚡ Quick Answer**\n"
                        "3. See the system in action!\n"
                        "4. Use `-help` for all commands"
                    ),
                    inline=False
                )
                owner_embed.set_footer(text="System is ready! Users can start opening tickets.")
                
                await guild.owner.send(embed=owner_embed)
                print(f"[on_guild_join] Setup complete for {guild.name}")
        else:
            if guild.owner:
                await guild.owner.send(
                    f"❌ I joined **{guild.name}** but I don't have permission to create channels.\n"
                    f"Please give me **Manage Channels** permission and try again."
                )
            print(f"[on_guild_join] Failed to setup {guild.name} - missing permissions")
            
    except Exception as e:
        print(f"[on_guild_join] Error setting up {guild.name}: {e}")
        if guild.owner:
            try:
                await guild.owner.send(f"⚠️ Error setting up support system: {e}")
            except:
                pass


@bot.command()
async def support(ctx):
    """Manually set up the support system if it wasn't created automatically."""
    try:
        # Check permissions
        if not ctx.guild.me.guild_permissions.manage_channels:
            await ctx.send(
                "❌ I don't have **Manage Channels** permission.\n"
                "Please give me this permission and try again."
            )
            return
        
        # Check if channels already exist
        existing_support = discord.utils.get(ctx.guild.text_channels, name="support")
        if existing_support:
            await ctx.send(
                "✅ Support channels already exist!\n"
                "Go to #support to use the buttons."
            )
            return
        
        await ctx.send("🔄 Setting up support system...")
        
        success = await setup_support_channels(ctx.guild)
        
        if success:
            setup_embed = discord.Embed(
                title="✅ Support System Created",
                description="Support channels have been successfully created!",
                color=discord.Color.green()
            )
            setup_embed.add_field(
                name="📍 New channels:",
                value=(
                    "• **#support** - Click buttons to open tickets\n"
                    "• **#support-tickets** - Private ticket threads"
                ),
                inline=False
            )
            setup_embed.add_field(
                name="📝 Next steps:",
                value=(
                    "1. Go to the #support channel\n"
                    "2. Click **🎫 Open Support Ticket** to start\n"
                    "3. Ask your question in the private thread\n"
                    "4. Use `-help` to see all commands"
                ),
                inline=False
            )
            await ctx.send(embed=setup_embed)
        else:
            await ctx.send(
                "❌ Failed to create support channels.\n"
                "Make sure I have **Manage Channels** permission."
            )
            
    except Exception as e:
        await ctx.send(f"❌ Error: {str(e)}")
        print(f"[support command] Error: {e}")


@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")
    print(f"📊 Connected to {len(bot.guilds)} server(s)")


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
        await reaction.message.channel.send(
            f"<@{data['user_id']}> Glad the answer was helpful!"
        )

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
                    try:
                        answer = await asyncio.wait_for(
                            query_graphlit_web(str(message.guild.id), message.content),
                            timeout=30.0
                        )
                    except asyncio.TimeoutError:
                        answer = "Query timed out. Please try again."
                    except Exception as e:
                        print(f"[on_message thread] query_graphlit_web error: {e}")
                        answer = f"Error: {str(e)}"
                
                await send_answer_with_feedback(
                    thread, message.author, message.guild.id, message.content, answer
                )
                if is_no_kb_response(answer):
                    await notify_mod_channel(
                        message.guild, thread, message.author, message.content
                    )
            except Exception as e:
                await thread.send(f"❌ An error occurred: {str(e)}")
                print(f"Error in ticket thread: {e}")
        return
    if message.channel.name == "support":
        support_tickets_channel = discord.utils.get(
            message.guild.text_channels, name="support-tickets"
        )
        if not support_tickets_channel:
            await message.channel.send(
                "❌ Could not find the `support-tickets` channel. Please contact an admin."
            )
            return
        try:
            thread = await get_or_create_ticket_thread(
                message.guild, support_tickets_channel, message.author
            )
        except discord.Forbidden:
            await message.channel.send(
                "❌ I don't have permission to create threads.\n"
                "Please give me **Create Private Threads** permission."
            )
            return
        except Exception as e:
            await message.channel.send(f"❌ Failed to open a ticket: {e}")
            print(f"Error creating ticket: {e}")
            return

        await message.reply(
            f"✅ Your support ticket is open here: {thread.mention}", delete_after=10
        )
        try:
            async with thread.typing():
                try:
                    answer = await asyncio.wait_for(
                        query_graphlit_web(str(message.guild.id), message.content),
                        timeout=30.0
                    )
                except asyncio.TimeoutError:
                    answer = "Query timed out. Please try again."
                except Exception as e:
                    print(f"[on_message support] query_graphlit_web error: {e}")
                    answer = f"Error: {str(e)}"
            
            await thread.send(f"**❓ Your Question:** {message.content}")
            await send_answer_with_feedback(
                thread, message.author, message.guild.id, message.content, answer
            )
            if is_no_kb_response(answer):
                await notify_mod_channel(
                    message.guild, thread, message.author, message.content
                )
        except Exception as e:
            await thread.send(f"❌ An error occurred: {str(e)}")
            print(f"Error answering in ticket: {e}")
        return
    channels = get_channels(str(message.guild.id))
    watch_ids = [c["channel_id"] for c in channels]
    if str(message.channel.id) in watch_ids:
        info = get_server(str(message.guild.id))
        if info is None:
            await message.channel.send("Please configure the bot on the dashboard.")
            return
        try:
            async with message.channel.typing():
                try:
                    answer = await asyncio.wait_for(
                        query_graphlit(str(message.guild.id), message.content),
                        timeout=30.0
                    )
                except asyncio.TimeoutError:
                    answer = "Query timed out. Please try again."
                except Exception as e:
                    print(f"[on_message KB] query_graphlit error: {e}")
                    answer = f"Error querying knowledge base: {str(e)}"
                
                if is_no_kb_response(answer):
                    try:
                        web_answer = await asyncio.wait_for(
                            query_graphlit_web(str(message.guild.id), message.content),
                            timeout=30.0
                        )
                        answer = web_answer
                    except asyncio.TimeoutError:
                        answer = "Web search timed out. Please try again."
                    except Exception as e:
                        print(f"[on_message Web] query_graphlit_web error: {e}")
            
            await send_answer_with_feedback(
                message.channel, message.author,
                message.guild.id, message.content, answer
            )
            if is_no_kb_response(answer):
                await notify_mod_channel(
                    message.guild, message.channel, message.author, message.content
                )
        except Exception as e:
            await message.channel.send(f"❌ An error occurred: {str(e)}")
            print(f"Error in on_message watched channel: {e}")
        return

    await bot.process_commands(message)

@bot.command()
@commands.cooldown(4, 60, commands.BucketType.user)
async def ask(ctx, *, question: str = None):
    try:
        if not question:
            await ctx.send("No question provided.\n Usage: `-ask <your question>`")
            return
        async with ctx.typing():
            try:
                answer = await asyncio.wait_for(
                    query_graphlit(str(ctx.guild.id), question),
                    timeout=30.0
                )
            except asyncio.TimeoutError:
                answer = "Query timed out. Please try again."
            except Exception as e:
                print(f"[ask] query_graphlit error: {e}")
                answer = f"Error: {str(e)}"
            
            if is_no_kb_response(answer):
                try:
                    web_answer = await asyncio.wait_for(
                        query_graphlit_web(str(ctx.guild.id), question),
                        timeout=30.0
                    )
                    answer = web_answer
                except asyncio.TimeoutError:
                    answer = "Web search timed out. Please try again."
                except Exception as e:
                    print(f"[ask] query_graphlit_web error: {str(e)}")
        
        await send_answer_with_feedback(
            ctx.channel, ctx.author, ctx.guild.id, question, answer
        )
        if is_no_kb_response(answer):
            await notify_mod_channel(ctx.guild, ctx.channel, ctx.author, question)
    except Exception as e:
        await ctx.send(f"❌ An error occurred: {str(e)}")
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
        await ctx.send("❌ Only the ticket owner or a moderator can close this ticket.")
        return
    embed = discord.Embed(
        title="🎫 Ticket Closed",
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
        title="📚 Bot Help & Commands",
        description="Here are all the available commands:",
        color=discord.Color.blurple()
    )
    embed.add_field(
        name="**🎫 Buttons in #support**",
        value=(
            "`🎫 Open Support Ticket` - Start a private conversation\n"
            "`⚡ Quick Answer` - Ask a quick question (modal)\n"
            "_Fastest way to get help!_"
        ),
        inline=False
    )
    embed.add_field(
        name="`-ask <question>`",
        value=(
            "Ask a question from the knowledge base\n"
            "Example: `-ask What is Python?`\n"
            "_Limited to 4 queries per minute_"
        ),
        inline=False
    )
    embed.add_field(
        name="`-close`",
        value=(
            "Close and archive your support ticket\n"
            "Only works inside a ticket thread"
        ),
        inline=False
    )
    embed.add_field(
        name="`-support`",
        value=(
            "Manually create the support system if it wasn't set up automatically"
        ),
        inline=False
    )
    embed.add_field(
        name="How it works:",
        value=(
            "1) Click: Use button in `#support` or `-ask` command\n"
            "2) Ask: Type your question\n"
            "3) Answer: I search the knowledge base\n"
            "4) Rate: React 👍 or 👎\n"
            "5) Improve: Your feedback helps us!"
        ),
        inline=False
    )
    embed.set_footer(text="Buttons are the fastest! Check #support")
    await ctx.send(embed=embed)

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandOnCooldown):
        await ctx.send(f"You're using this command too fast! Try again in {error.retry_after:.1f} seconds.")
    elif isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"❌ Missing required argument. Use `-help` to see command usage.")
    elif isinstance(error, commands.CommandNotFound):
        return
    else:
        print(f"[on_command_error] {type(error).__name__}: {error}")

bot.run(DISCORD_BOT_KEY)