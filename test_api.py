import os
import sys
import httpx
import jwt
import asyncio
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

sys.path.append("/Users/aayushichhabra/q-aragbaseddicordbotproject")

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# Generate token for aayushi0864#0 (discord_id: 954472198096175164)
def make_token(discord_id):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": discord_id,
        "discord_id": discord_id,
        "guilds": [],
        "iat": now,
        "exp": now + timedelta(minutes=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def test_api():
    token = make_token("954472198096175164")
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # Test 1: GET /guilds/eligible
        print("Testing GET http://localhost:8000/guilds/eligible...")
        try:
            resp = await client.get("http://localhost:8000/guilds/eligible", headers=headers, timeout=10)
            print("Status Code:", resp.status_code)
            print("Response Headers:", resp.headers)
            print("Response Content:", resp.text)
        except Exception as e:
            print("Error connecting to /guilds/eligible:", e)
            
        # Test 2: GET /server/list
        print("\nTesting GET http://localhost:8000/server/list...")
        try:
            resp = await client.get("http://localhost:8000/server/list", headers=headers, timeout=10)
            print("Status Code:", resp.status_code)
            print("Response Content:", resp.text)
        except Exception as e:
            print("Error connecting to /server/list:", e)

asyncio.run(test_api())
