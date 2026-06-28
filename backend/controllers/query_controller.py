import asyncio
import sys
import os
import re

from fastapi import HTTPException, Request

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.query import *
def is_no_kb_response(answer: str) -> bool:
    if not answer or len(answer.strip()) < 10:
        return True
    answer_lower = answer.lower().strip()
    no_answer_phrases = [
        "i don't have this information",
        "i don't have that information",
        "this information is not available",
        "that information is not available",
        "i cannot find",
        "i can't find",
        "no information",
        "no data",
        "not found in knowledge base",
        "outside my knowledge",
        "outside of my knowledge",
        "unable to answer",
        "cannot answer",
        "can't answer",
        "not in my knowledge",
        "no relevant",
        "no matching",
        "couldn't find",
        "not available",
        "beyond my scope",
        "outside my expertise",
        "don't have access",
        "no results",
        "no knowledge base found",
        "web search is paused",
        "query timed out",
        "web search timed out",
        "error querying knowledge base",
        "error during web search",
        "web search is temporarily unavailable",
        "i don't know",
        "i don't have information",
    ]
    for phrase in no_answer_phrases:
        if phrase in answer_lower:
            return True
    patterns = [
        r"i\s+(?:don't|do not|cannot|can't)\s+(?:know|answer|help|assist|have)",
        r"(?:apologize|sorry).*?(?:don't|do not|cannot|can't)\s+(?:know|have|find|provide)",
        r"unfortunately.*?(?:don't|do not|cannot|can't)\s+(?:know|have|find|provide)",
        r"no\s+(?:answer|information|data|results|matches?|knowledge\s+base)",
        r"not\s+(?:in|part of|covered|included).*?(?:knowledge|information|database|kb)",
    ]
    for pattern in patterns:
        if re.search(pattern, answer_lower):
            return True
    if len(answer_lower) < 10 and any(word in answer_lower for word in ["no", "cannot", "can't", "don't"]):
        return True
    return False

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
        #if is_no_kb_response(answer):
            #answer= await query_graphlit_web(server,question)
        return {"answer": answer}
    except Exception as e:
        print(f"[handle_query] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")