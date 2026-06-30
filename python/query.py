import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from graphlit import Graphlit
import asyncio
from dbhelper.db_helper import (
    get_channel_spec, get_kb_spec_id, get_web_spec_id, save_channel_spec, save_spec_id,
    get_content_ids, get_feed_ids, get_web_search, delete_spec_id
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

if not all([env_id, org_key, jwt_secret]):
    raise ValueError(f"Missing Graphlit config — env_id={env_id}, org_key={org_key}, jwt_secret={'set' if jwt_secret else 'MISSING'}")

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
Always respond in {language} with a {tone} tone.

LANGUAGE PRIORITY:
- Default to {language} for your response.
- If the user writes their message in a clearly different language than {language}, respond in the user's language instead for that turn.
- If the user's language is unclear, mixed, or ambiguous, fall back to {language}.

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
Always respond in {language} with a {tone} tone.

LANGUAGE PRIORITY:
- Default to {language} for your response.
- If the user writes their message in a clearly different language than {language}, respond in the user's language instead for that turn.
- If the user's language is unclear, mixed, or ambiguous, fall back to {language}.

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


async def get_or_create_kb_spec(server_id: str, channel_id: str, language: str, tone: str) -> str:
    row = await get_channel_spec(server_id, channel_id)
    if row and row.get("kb_spec_id"):
        if row.get("language") == language and row.get("tone") == tone:
            try:
                await graphlit.client.get_specification(id=row["kb_spec_id"])
                return row["kb_spec_id"]
            except Exception:
                print(f"[WARN] KB spec {row['kb_spec_id']} not found in Graphlit, recreating...")

    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_{channel_id}_kb_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.OPEN_AI,
            system_prompt=build_kb_system_prompt(language, tone),
            retrieval_strategy=RetrievalStrategyInput(
                type=RetrievalStrategyTypes.CHUNK,
                content_limit=10,
            ),
            open_ai=OpenAIModelPropertiesInput(
                model=OpenAIModels.GPT4O_MINI_128K,
                temperature=0.2,
                completion_token_limit=1000,
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    print(f"[SPEC] Created new KB spec: {spec_id} for channel {channel_id}")
    await save_channel_spec(server_id, channel_id, "kb", spec_id)
    return spec_id


async def get_or_create_web_spec(server_id: str, channel_id: str, language: str, tone: str) -> str:
    row = await get_channel_spec(server_id, channel_id)
    if row and row.get("web_spec_id"):
        if row.get("language") == language and row.get("tone") == tone:
            return row["web_spec_id"]
    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_{channel_id}_web_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.GOOGLE,
            system_prompt=build_web_system_prompt(language, tone),
            google=GoogleModelPropertiesInput(
                model=GoogleModels.GEMINI_2_5_FLASH,
                temperature=0.3,
                completion_token_limit=500,
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    await save_channel_spec(server_id, channel_id, "web", spec_id)
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
    question: str,
    channel_id: str | None = None,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
) -> str:
    print("Query Graphlit Called")

    if is_small_talk(question):
        return "Hello! How can I help you today?"

    try:
        content_ids = await get_content_ids(server_id)
        feed_ids    = await get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []

    if not content_ids and not feed_ids:
        return "No knowledge base found for this server."
    if channel_id:
        spec_id = await get_or_create_kb_spec(server_id, channel_id, language, tone)
    else:
        spec_id = await get_kb_spec_id_for_dashboard(server_id)
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

        prompt = question
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}"

        response = await graphlit.client.prompt_conversation(
            prompt=prompt,
            mime_type=None,
            data=None,
            id=conversation_id,
            persona=None,
            system_prompt=None,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None,
        )
        result = response.prompt_conversation
        if result is None or result.message is None or result.message.message is None:
            return "I don't know"
        return result.message.message[:1800]

    finally:
        try:
            if conversation_id:
                await graphlit.client.delete_conversation(id=conversation_id)
        except Exception as e:
            print(f"[WARN] Failed to delete KB conversation: {e}")


async def query_graphlit_web(
    server_id: str,
    question: str,
    channel_id: str | None = None,
    language: str = "english",
    tone: str = "professional",
    prv_messages: str = "",
) -> str:
    print("Query Graphlit Web Called")

    if is_small_talk(question):
        return "Hello! How can I help you today?"

    conversation_id = None
    try:
        response = await graphlit.client.search_web(text=question, service=SearchServiceTypes.TAVILY, limit=3)
        result = response.search_web
        if result is None:
            response = await graphlit.client.search_web(text=question, service=SearchServiceTypes.EXA, limit=5)
            result = response.search_web

        if not result or not result.results:
            return "I don't have this information"

        context = ""
        for i, r in enumerate(result.results, 1):
            context += f"[{i}] {getattr(r, 'title', '')}\nURL: {getattr(r, 'uri', '')}\n{getattr(r, 'text', '')}\n\n"

        prompt = f"Question: {question}\n\n"
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}\n\n"
        prompt += (
            f"Using the following search results, answer the question above.\n\n"
            f"Search Results:\n{context}\n\n"
            f"Give a clear, concise answer under 1800 characters. Cite sources by number e.g. [1], [2]."
        )
        if channel_id:
            spec_id = await get_or_create_web_spec(server_id, channel_id, language, tone)
        else:
            spec_id = await get_web_spec_id_for_dashboard(server_id)

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
            system_prompt=None,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None,
        )
        result_msg = answer_response.prompt_conversation
        if result_msg is None or result_msg.message is None or result_msg.message.message is None:
            return "I don't know"
        return result_msg.message.message[:1800]

    except Exception as exc:
        print(f"[ERROR] query_graphlit_web: {exc}")
        return "Sorry, web search is temporarily unavailable. Please try again."

    finally:
        try:
            if conversation_id:
                await graphlit.client.delete_conversation(id=conversation_id)
        except Exception as e:
            print(f"[WARN] Failed to delete web conversation: {e}")

async def get_kb_spec_id_for_dashboard(server_id: str) -> str:
    try:
        spec_id = await get_kb_spec_id(server_id)
        if not spec_id:
            spec_response = await graphlit.client.create_specification(
                specification=SpecificationInput(
                    name=f"{server_id}_kb_spec",
                    type=SpecificationTypes.COMPLETION,
                    service_type=ModelServiceTypes.OPEN_AI,
                    system_prompt=build_kb_system_prompt(language="english", tone="professional"),
                    retrieval_strategy=RetrievalStrategyInput(
                        type=RetrievalStrategyTypes.CHUNK,
                        content_limit=10,
                    ),
                    open_ai=OpenAIModelPropertiesInput(
                        model=OpenAIModels.GPT4O_MINI_128K,
                        temperature=0.2,
                        completion_token_limit=1000,
                    ),
                )
            )
            spec_id = spec_response.create_specification.id
            await save_spec_id(server_id, "kb", spec_id)  # ← was missing "kb"
        return spec_id
    except Exception as e:
        print(f"[get_kb_spec_id_for_dashboard] Error: {e}")
        raise


async def get_web_spec_id_for_dashboard(server_id: str) -> str:
    try:
        spec_id = await get_web_spec_id(server_id)
        if not spec_id:
            spec_response = await graphlit.client.create_specification(
                specification=SpecificationInput(
                    name=f"{server_id}_web_spec",
                    type=SpecificationTypes.COMPLETION,
                    service_type=ModelServiceTypes.GOOGLE,
                    system_prompt=build_web_system_prompt(language="english", tone="professional"),
                    google=GoogleModelPropertiesInput(
                        model=GoogleModels.GEMINI_2_5_FLASH,
                        temperature=0.3,
                        completion_token_limit=500,
                    ),
                )
            )
            spec_id = spec_response.create_specification.id
            await save_spec_id(server_id, "web", spec_id)
        return spec_id
    except Exception as e:
        print(f"[get_web_spec_id_for_dashboard] Error: {e}")
        raise





