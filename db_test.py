import os
import sys
import httpx
import asyncio
from dotenv import load_dotenv

sys.path.append("/Users/aayushichhabra/q-aragbaseddicordbotproject")

load_dotenv()

from dbhelper.db_helper import *

async def test_all():
    print("Fetching active admin users from DB...")
    with DB() as s:
        rows = s.execute(text("SELECT * FROM admin_users")).mappings().all()
        users = [dict(r) for r in rows]
    
    print(f"Found {len(users)} users in database:")
    for u in users:
        print(f"- discord_id: {u['discord_id']}, username: {u['username']}, token_expiry: {u['discord_token_expiry']}")
        
        # Test Discord API using their token
        print("Testing Discord API request for this user...")
        DISCORD_API = os.getenv("DISCORD_API", "https://discord.com/api/v10")
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{DISCORD_API}/users/@me/guilds",
                    headers={"Authorization": f"Bearer {u['discord_access_token']}"},
                    timeout=10,
                )
            print("Discord API Response Status:", resp.status_code)
            if resp.status_code == 200:
                guilds = resp.json()
                print(f"Successfully retrieved {len(guilds)} guilds from Discord!")
                ADMIN_PERMISSION = 0x8
                eligible = [
                    g for g in guilds
                    if g.get("owner") or (int(g.get("permissions") or 0) & ADMIN_PERMISSION)
                ]
                print(f"Eligible guilds: {len(eligible)}")
            else:
                print("Response Body:", resp.text)
        except Exception as e:
            print("ERROR querying Discord API:", e)

asyncio.run(test_all())
