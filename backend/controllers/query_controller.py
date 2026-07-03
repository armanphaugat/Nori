import asyncio
import sys
import os
import re

from fastapi import HTTPException, Request

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.query import (
    query_graphlit_without_language,
    query_graphlit_web,
    NO_ANSWER_SENTINEL,
)
from dbhelper.db_helper import get_web_search


def is_no_kb_response(answer: str) -> bool:
    """True only when the KB genuinely produced no answer.

    Keys off the NO_ANSWER_SENTINEL token the model is instructed to emit,
    plus the exact 'no knowledge base' system message. Deliberately does NOT
    fuzzy-match natural-language phrases like "not available" — that was
    discarding correct answers (e.g. "The library is not available on Sundays").
    """
    if not answer or not answer.strip():
        return True
    a = answer.strip()
    if NO_ANSWER_SENTINEL in a:
        return True
    return a.lower().startswith("no knowledge base found")


def strip_no_answer_sentinel(answer: str) -> str:
    """Replace a bare sentinel with a friendly user-facing message."""
    if answer and NO_ANSWER_SENTINEL in answer:
        return "I don't have this information."
    return answer


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
        # Auto-detects the user's language (Hindi/Hinglish/Punjabi/etc.) from the message.
        answer = await query_graphlit_without_language(server, question)

        # Fall back to web search only when the KB genuinely had nothing,
        # and only if the server admin has web search enabled.
        if is_no_kb_response(answer):
            try:
                if await get_web_search(server):
                    answer = await query_graphlit_web(server, question)
            except Exception as web_err:
                print(f"[handle_query] Web fallback failed: {web_err}")

        return {"answer": strip_no_answer_sentinel(answer)}
    except Exception as e:
        print(f"[handle_query] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")