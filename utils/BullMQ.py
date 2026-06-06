import asyncio
import os
import sys

from bullmq import Queue, Worker

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import (  # noqa: E402
    rotate_exa_key,
    rotate_key,
    rotate_tavily_key,
    set_exa_key,
    set_key,
    set_tavily_key,
)

connection = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": int(os.getenv("REDIS_PORT", 6379)),
}
_redis_password = os.getenv("REDIS_PASSWORD", "")
if _redis_password:
    connection["password"] = _redis_password

queue = Queue("api-key-rotation", {"connection": connection})


async def process(job, job_token):
    rotate_key()
    set_key()
    rotate_exa_key()
    set_exa_key()
    rotate_tavily_key()
    set_tavily_key()


worker = Worker("api-key-rotation", process, {"connection": connection})


async def main():
    await queue.add(
        "api-key-rotation",
        {},
        {
            "repeat": {"every": 5 * 60 * 1000},
            "attempts": 3,
            "backoff": {"type": "exponential", "delay": 5000},
        },
    )
    await asyncio.Future()


asyncio.run(main())
