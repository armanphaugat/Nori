import os
from dotenv import load_dotenv
from ragie import Ragie
from anthropic import Anthropic
from dbhelper.db_helper import get_content_ids, get_feed_ids, get_channel_knowledge_sources

load_dotenv(override=True)
RAGIE_API_KEY = os.getenv("RAGIE_API_KEY")

r_client = Ragie(auth=RAGIE_API_KEY)
llm_client = Anthropic()

SMALL_TALK = {"hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye", "ok", "okay"}


def is_small_talk(question: str) -> bool:
    return question.strip().lower() in SMALL_TALK


def build_kb_system_prompt(language: str = "english", tone: str = "professional") -> str:
    return f"""
You are a helpful knowledge base assistant. Answer questions based on provided documents.
Respond with a {tone} tone.

LANGUAGE RULE — ABSOLUTE REQUIREMENT:
- You MUST respond in {language.upper()} only. This is non-negotiable.
- The user may write in any language. You must STILL reply in {language.upper()}.
- Do NOT mirror or match the user's input language.
- Do NOT translate your response into any other language.
- If {language} is unclear or invalid, default to English

ANSWERING RULES:
- Answer from documents. If partially covered, share what you know.
- Make reasonable inferences from document content.
- If the topic is completely absent from documents, output EXACTLY this phrase and nothing else:
I don't have this information
- Never fabricate facts or use outside knowledge.

CRITICAL: When you have no information, you MUST output ONLY the exact phrase:
I don't have this information
Do NOT rephrase it. Do NOT add any other text.

FORMAT (only when answer exists):
- Clear, helpful answers under 1800 characters
- Use bullet points or numbered lists when appropriate
- Do not mention source IDs or document references
"""


def build_kb_system_prompt_without_language() -> str:
    return """
You are a helpful knowledge base assistant. Answer questions based on provided documents.
Respond with a professional tone.

LANGUAGE RULE (STRICT):
- Detect the language of the user's CURRENT message and reply in that same language.
- If the language can't be confidently determined (emojis, "ok", "hi", "?"), reply in English.

ANSWERING RULES:
- Answer from documents. If partially covered, share what you know.
- Make reasonable inferences from document content.
- If the topic is completely absent from documents, output EXACTLY this phrase and nothing else:
I don't have this information
- Never fabricate facts or use outside knowledge.

FORMAT (only when answer exists):
- Clear, helpful answers under 1800 characters
- Use bullet points or numbered lists when appropriate
- Do not mention source IDs or document references
"""

def build_or_filter(content_ids: list, feed_ids: list) -> dict | None:
    """
    Ragie has no separate 'feed' object like Graphlit — every ingested item
    (file, text, github file, connector-synced doc) is just a document with
    its own document_id. content_ids + feed_ids collapse into one $in list.
    Server-level scoping is already handled separately by the `partition` param
    on the retrieve call, so this filter only needs to narrow down to the
    specific document IDs for that server.
    """
    all_ids = [*content_ids, *feed_ids]
    if not all_ids:
        return None
    return {"document_id": {"$in": all_ids}}


async def _retrieve_and_answer(server_id, question, system_prompt, doc_filter, prv_messages):
    try:
        res = await r_client.retrievals.retrieve_async(request={
            "query": question,
            "partition": server_id,
            "filter": doc_filter,
            "rerank": True,
            "top_k": 8,
        })
        chunks = res.scored_chunks
    except Exception as e:
        print(f"[WARN] Retrieval failed: {e}")
        return "No knowledge base found for this server.", []

    if not chunks:
        return "No knowledge base found for this server.", []

    context = "\n\n".join(f"[{i+1}] {c.text}" for i, c in enumerate(chunks))
    citations = [{"content": {"id": c.document_id}, "score": c.score} for c in chunks]

    prompt = question
    if prv_messages:
        prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}"

    try:
        response = llm_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Context:\n{context}\n\n{prompt}"}],
        )
        return response.content[0].text[:1800], citations
    except Exception as e:
        print(f"[WARN] LLM call failed: {e}")
        return "I don't know", []


async def query_graphlit(
    server_id: str,
    channel_id: str,
    question: str,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
):
    if is_small_talk(question):
        return "Hello! How can I help you today?", []

    try:
        result = await get_channel_knowledge_sources(server_id, channel_id)
        if result:
            content_ids = [row["content_id"] for row in result if row.get("content_id")]
            feed_ids = [row["feed_id"] for row in result if row.get("feed_id")]
        else:
            content_ids = await get_content_ids(server_id)
            feed_ids = await get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []

    if not content_ids and not feed_ids:
        return "No knowledge base found for this server.", []

    doc_filter = build_or_filter(content_ids, feed_ids)
    system_prompt = build_kb_system_prompt(language, tone)
    return await _retrieve_and_answer(server_id, question, system_prompt, doc_filter, prv_messages)


async def query_graphlit_without_language(
    server_id: str,
    channel_id: str,
    question: str,
    prv_messages: str = "",
):
    if is_small_talk(question):
        return "Hello! How can I help you today?", []
    try:
        result = await get_channel_knowledge_sources(server_id, channel_id)
        if result:
            content_ids = [row["content_id"] for row in result if row.get("content_id")]
            feed_ids = [row["feed_id"] for row in result if row.get("feed_id")]
        else:
            content_ids = await get_content_ids(server_id)
            feed_ids = await get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []
    if not content_ids and not feed_ids:
        return "No knowledge base found for this server.", []
    doc_filter = build_or_filter(content_ids, feed_ids)
    system_prompt = build_kb_system_prompt_without_language()
    return await _retrieve_and_answer(server_id, question, system_prompt, doc_filter, prv_messages)


async def query_graphlit_web(
    server_id: str,
    question: str,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
):
    """No native web search in Ragie — same Tavily/Exa call you already have, unchanged."""
    if is_small_talk(question):
        return "Hello! How can I help you today?", []
    raise NotImplementedError("Reuse your existing Tavily/Exa search_web logic here — Ragie has no web search")