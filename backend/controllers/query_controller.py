import asyncio
import sys
import os

from fastapi import HTTPException, Request

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.query import answer_query


async def handle_query(request: Request) -> dict:
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    question = (data.get("question") or "").strip()
    server   = (data.get("server") or "").strip()

    if not question:
        raise HTTPException(status_code=400, detail="'question' is required")
    if not server:
        raise HTTPException(status_code=400, detail="'server' is required")

    try:
        loop   = asyncio.get_running_loop()
        answer = await loop.run_in_executor(None, answer_query, question, server)
        return {"answer": answer}
    except Exception as e:
        print(f"[handle_query] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")