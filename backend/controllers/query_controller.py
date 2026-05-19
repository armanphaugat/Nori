import asyncio
import sys
import os

from fastapi import HTTPException, Request

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.query import *
def is_no_kb_response(answer: str) -> bool:
    if not answer or not answer.strip():
        return True
    
    normalized = answer.lower().strip().rstrip(".")
    return "i don't know" in normalized

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
        answer = await query_graphlit(server,question)
        if is_no_kb_response(answer):
            answer= await query_graphlit_web(server,question)
        return {"answer": answer}
    except Exception as e:
        print(f"[handle_query] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")