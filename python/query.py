import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from graphlit import Graphlit
import asyncio
from dbhelper.db_helper import (
    get_content_ids, get_feed_ids,get_channel_knowledge_sources
)
from graphlit_api import (
    SpecificationInput, SpecificationTypes, ModelServiceTypes,
    RetrievalStrategyInput, RetrievalStrategyTypes,
    OpenAIModelPropertiesInput, OpenAIModels,
    ConversationInput, EntityReferenceInput, ContentCriteriaInput, ContentCriteriaLevelInput,
    SearchServiceTypes, GoogleModelPropertiesInput, GoogleModels
)

env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_ID") or os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")
KB_SPEC_ID = os.getenv("GRAPHLIT_KB_SPEC_ID",None)
WEB_SPEC_ID = os.getenv("GRAPHLIT_WEB_SPEC_ID",None)
print(KB_SPEC_ID)
print(WEB_SPEC_ID)

graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)

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

CONVERSATION HANDLING:
- Greetings/farewells/small talk: respond naturally, no sources needed
- Compliments: acknowledge graciously

ANSWERING RULES:
- Answer from documents. If partially covered, share what you know.
- Make reasonable inferences from document content.
- If the topic is completely absent from documents, output EXACTLY this phrase and nothing else:
I don't have this information
- Never fabricate facts or use outside knowledge.

CRITICAL: When you have no information, you MUST output ONLY the exact phrase:
I don't have this information
Do NOT rephrase it. Do NOT add any other text. Do NOT say "I currently do not have" or any variation.

FORMAT (only when answer exists):
- Clear, helpful answers under 1800 characters
- Use bullet points or numbered lists when appropriate
- Do not mention source IDs or document references
"""

def build_kb_system_prompt_without_language() -> str:
    return f"""
You are a helpful knowledge base assistant. Answer questions based on provided documents.
Respond with a Proffesional tone.

LANGUAGE RULE (STRICT - MUST FOLLOW):
- Detect the language of the user's CURRENT message only.
- Always reply in the same language as the user's CURRENT message.
- Never translate the response into any other language.
- Ignore the configured default language when the user's language can be identified.
- If the user's message is multilingual, reply in the language that makes up most of the message.
- If the language cannot be determined confidently (e.g. emojis, very short text like "ok", "hi", "?", or ambiguous input), reply in English.
- Do not mention the detected language or explain your choice.
- This rule overrides all other language preferences.

CONVERSATION HANDLING:
- Greetings/farewells/small talk: respond naturally, no sources needed
- Compliments: acknowledge graciously

ANSWERING RULES:
- Answer from documents. If partially covered, share what you know.
- Make reasonable inferences from document content.
- If the topic is completely absent from documents, output EXACTLY this phrase and nothing else:
I don't have this information
- Never fabricate facts or use outside knowledge.

CRITICAL: When you have no information, you MUST output ONLY the exact phrase:
I don't have this information
Do NOT rephrase it. Do NOT add any other text. Do NOT say "I currently do not have" or any variation.

FORMAT (only when answer exists):
- Clear, helpful answers under 1800 characters
- Use bullet points or numbered lists when appropriate
- Do not mention source IDs or document references
"""


def build_web_system_prompt(language: str = "english", tone: str = "professional") -> str:
    return f"""
You are a helpful web search assistant. Answer questions based on provided search results.
Respond with a {tone} tone.

LANGUAGE AND TONE RULE (STRICT - MUST FOLLOW):
- Reply ONLY in the language explicitly specified by the "{language}" parameter.
- If "{language}" is missing, empty, invalid, or cannot be determined, reply in English.
- The "{language}" parameter determines ONLY the response language.
- The "{tone}" parameter determines ONLY the writing style and tone of the response.
- Do not infer or change the response language based on the user's message.
- Do not let the selected language affect the tone, and do not let the tone affect the language.
- These rules override any conflicting instructions.

CONVERSATION HANDLING:
- Greetings/farewells/small talk: respond naturally, no citations needed

ANSWERING RULES:
- Answer from search results. Share partial information if fully covered answer isn't available.
- Make reasonable inferences from search results.
- Only say "I don't have this information" if results contain nothing relevant.
- Never fabricate facts or invent URLs.

FORMAT:
- Clear, helpful answers under 1800 characters
- Always cite sources with URL or site name
- Use bullet points or numbered lists when appropriate
- Prefer recent and authoritative sources
"""


async def get_kb_spec() -> str:
    #spec_id = KB_SPEC_ID
    spec_id = KB_SPEC_ID
    return spec_id

async def get_web_spec() -> str:
    spec_id = WEB_SPEC_ID
    return spec_id


def build_or_filter(content_ids: list, feed_ids: list) -> list | None:
    or_clauses = []
    for cid in content_ids:
        or_clauses.append(ContentCriteriaLevelInput(
            contents=[EntityReferenceInput(id=cid)]
        ))

    for fid in feed_ids:
        or_clauses.append(ContentCriteriaLevelInput(
            feeds=[EntityReferenceInput(id=fid)]
        ))

    return or_clauses if or_clauses else None


async def query_graphlit(
    server_id: str,
    channel_id: str,
    question: str,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
) -> str:
    print(f"Query Graphlit Called WITH Language: {language}, Tone: {tone}")
    if is_small_talk(question):
        return "Hello! How can I help you today?",[]
    try:
        result=await get_channel_knowledge_sources(server_id,channel_id)
        if result:
            content_ids = [row["content_id"] for row in result if row.get("content_id")]
            feed_ids    = [row["feed_id"] for row in result if row.get("feed_id")]
        else:
            content_ids = await get_content_ids(server_id)
            feed_ids    = await get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []

    if not content_ids and not feed_ids:
        return "No knowledge base found for this server.",[]
    spec_id=await get_kb_spec()
    print(f"[query_graphlit_kb] content_ids={content_ids}")
    print(f"[query_graphlit_kb] feed_ids={feed_ids}")
    print(f"[query_graphlit_kb] spec_id={spec_id}")
    conversation_id = None
    try:
        or_filter = build_or_filter(content_ids, feed_ids)
        conv_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_kb_query",
                specification=EntityReferenceInput(id=spec_id),
                filter=ContentCriteriaInput(or_=or_filter),
            )
        )
        conversation_id = conv_response.create_conversation.id
        system_prompt = build_kb_system_prompt(language, tone)
        prompt = question
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}"

        response = await graphlit.client.prompt_conversation(
            prompt=prompt,
            mime_type=None,
            data=None,
            id=conversation_id,
            persona=None,
            system_prompt=system_prompt,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None,
        )
        result = response.prompt_conversation
        if result is None or result.message is None or result.message.message is None:
            return "I don't know",[]
        return result.message.message[:1800],result.message.citations if result.message.citations else []
    finally:
        try:
            if conversation_id:
                await graphlit.client.delete_conversation(id=conversation_id)
        except Exception as e:
            print(f"[WARN] Failed to delete KB conversation: {e}")

async def query_graphlit_without_language(
    server_id: str,
    channel_id: str,
    question: str,
    prv_messages: str = "",
) -> str:
    print("Query_Graphlit_Called_Without_Language")
    if is_small_talk(question):
        return "Hello! How can I help you today?",[]
    try:
        result=await get_channel_knowledge_sources(server_id,channel_id)
        if result:
            content_ids = [row["content_id"] for row in result if row.get("content_id")]
            feed_ids    = [row["feed_id"] for row in result if row.get("feed_id")]
        else:
            content_ids = await get_content_ids(server_id)
            feed_ids    = await get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []

    if not content_ids and not feed_ids:
        return "No knowledge base found for this server.",[]
    spec_id=await get_kb_spec()
    print(f"[query_graphlit_kb] content_ids={content_ids}")
    print(f"[query_graphlit_kb] feed_ids={feed_ids}")
    print(f"[query_graphlit_kb] spec_id={spec_id}")
    conversation_id = None
    try:
        or_filter = build_or_filter(content_ids, feed_ids)
        conv_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_kb_query",
                specification=EntityReferenceInput(id=spec_id),
                filter=ContentCriteriaInput(or_=or_filter),
            )
        )
        conversation_id = conv_response.create_conversation.id
        system_prompt = build_kb_system_prompt_without_language()
        prompt = question
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}"

        response = await graphlit.client.prompt_conversation(
            prompt=prompt,
            mime_type=None,
            data=None,
            id=conversation_id,
            persona=None,
            system_prompt=system_prompt,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None,
        )
        result = response.prompt_conversation
        if result is None or result.message is None or result.message.message is None:
            return "I don't know", []
        return result.message.message[:1800],result.message.citations if result.message.citations else []
    finally:
        try:
            if conversation_id:
                await graphlit.client.delete_conversation(id=conversation_id)
        except Exception as e:
            print(f"[WARN] Failed to delete KB conversation: {e}")


async def query_graphlit_web(
    server_id: str,
    question: str,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
) -> str:
    print("Query Graphlit Web Called")

    if is_small_talk(question):
        return "Hello! How can I help you today?", []

    conversation_id = None
    try:
        response = await graphlit.client.search_web(text=question, service=SearchServiceTypes.TAVILY, limit=3)
        result = response.search_web
        if result is None:
            response = await graphlit.client.search_web(text=question, service=SearchServiceTypes.EXA, limit=5)
            result = response.search_web

        if not result or not result.results:
            return "I don't have this information", []

        context = ""
        for i, r in enumerate(result.results, 1):
            context += f"[{i}] {getattr(r, 'title', '')}\nURL: {getattr(r, 'uri', '')}\n{getattr(r, 'text', '')}\n\n"

        system_prompt = build_web_system_prompt(language, tone)

        prompt = f"Question: {question}\n\n"
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}\n\n"
        prompt += (
            f"Using the following search results, answer the question above.\n\n"
            f"Search Results:\n{context}\n\n"
            f"Give a clear, concise answer under 1800 characters. Cite sources by number e.g. [1], [2]."
        )
        spec_id=await get_web_spec()
        conv_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_web_query",
                specification=EntityReferenceInput(id=spec_id),
            )
        )
        conversation_id = conv_response.create_conversation.id

        answer_response = await graphlit.client.prompt_conversation(
            prompt=prompt,
            id=conversation_id,
            mime_type=None,
            data=None,
            persona=None,
            system_prompt=system_prompt,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None,
        )
        result_msg = answer_response.prompt_conversation
        if result_msg is None or result_msg.message is None or result_msg.message.message is None:
            return "I don't know", []
        return result_msg.message.message[:1800], result_msg.message.citations if result_msg.message.citations else []

    except Exception as exc:
        print(f"[ERROR] query_graphlit_web: {exc}")
        return "Sorry, web search is temporarily unavailable. Please try again.", []

    finally:
        try:
            if conversation_id:
                await graphlit.client.delete_conversation(id=conversation_id)
        except Exception as e:
            print(f"[WARN] Failed to delete web conversation: {e}")
        
async def main():
    spec_id = await get_kb_spec()
    print("Created spec_id:", spec_id)
 
 
if __name__ == "__main__":
    asyncio.run(main())