import asyncio
from bullmq import Queue,Worker
from redis import asyncio as ioredis
import os
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
from utils.apikeyrotation import rotate_key, get_key, set_key
connection={
    "host":"localhost",
    "port":6379,
    "password":""
}
queue=Queue(
    "api-key-rotation",{"connection":connection}
)
async def process(job,job_token):
    rotate_key()
    set_key()

worker = Worker("api-key-rotation", process, {"connection": connection})
async def main():
    await queue.add(
        "api-key-rotation",
        {},{
            "repeat":   { "every": 5 * 60 * 1000 },
            "attempts": 3,
            "backoff":  { "type": "exponential", "delay": 5000 },
        }
    )
    await asyncio.Future()
asyncio.run(main())