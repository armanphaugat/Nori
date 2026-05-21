import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from dbhelper.db_helper import *
from graphlit import Graphlit
from graphlit_api import *

env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")

if not all([env_id, org_key, jwt_secret]):
    raise ValueError(f"Missing Graphlit config — env_id={env_id}, org_key={org_key}, jwt_secret={'set' if jwt_secret else 'MISSING'}")

graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)

KB_SYSTEM_PROMPT = (
    "You are a helpful assistant. Always cite which document or source "
    "your answer comes from. If the answer is not found in the provided "
    "documents, say 'I don't know'. "
    "Keep your answer concise and under 1800 characters."
)

WEB_SYSTEM_PROMPT = (
    "You are a helpful assistant. Search the web and answer clearly. "
    "Always cite your sources. "
    "Keep your answer concise and under 1800 characters."
)


async def _get_or_create_kb_spec(server_id: str) -> str:
    try:
        spec_id = get_kb_spec_id(server_id)
        if spec_id:
            return spec_id
    except Exception as e:
        print(f"[WARN] DB lookup kb_spec failed: {e}")

    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_kb_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.OPEN_AI,
            system_prompt=KB_SYSTEM_PROMPT,
            retrieval_strategy=RetrievalStrategyInput(
                type=RetrievalStrategyTypes.CONTENT,
                content_limit=10,
            ),
            open_ai=OpenAIModelPropertiesInput(
                model=OpenAIModels.GPT4O_128K,
                temperature=0.2,
                completion_token_limit=1000,
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    try:
        save_spec_id(server_id, "kb_spec", spec_id)
    except Exception as e:
        print(f"[WARN] DB save kb_spec failed: {e}")
    return spec_id


async def query_graphlit(server_id: str, question: str) -> str:
    try:
        content_ids = get_content_ids(server_id)
        feed_ids = get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []

    if not content_ids and not feed_ids:
        return "No knowledge base found for this server."

    spec_id = await _get_or_create_kb_spec(server_id)
    response = await graphlit.client.create_conversation(
        conversation=ConversationInput(
            name=f"{server_id}_kb_query",
            specification=EntityReferenceInput(id=spec_id),
            filter=ContentCriteriaInput(
                contents=[EntityReferenceInput(id=cid) for cid in content_ids] if content_ids else None,
                feeds=[EntityReferenceInput(id=fid) for fid in feed_ids] if feed_ids else None
            )
        )
    )
    conversation_result = response.create_conversation
    response = await graphlit.client.prompt_conversation(
        prompt=question,
        mime_type=None,
        data=None,
        id=conversation_result.id,
        specification=EntityReferenceInput(id=spec_id),
        persona=None,
        system_prompt=None,
        tools=None,
        require_tool=None,
        include_details=True,
        correlation_id=None
    )
    result = response.prompt_conversation
    if result is None or result.message is None or result.message.message is None:
        return "I don't know"
    return result.message.message[:1800]

async def _get_or_create_web_spec(server_id: str) -> str:
    try:
        spec_id = get_spec_id(server_id, "web_spec")
        if spec_id:
            return spec_id
    except Exception as e:
        print(f"[WARN] DB lookup web_spec failed: {e}")

    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_web_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.OPEN_AI,
            system_prompt=WEB_SYSTEM_PROMPT,
            open_ai=OpenAIModelPropertiesInput(
                model=OpenAIModels.GPT4O_128K,
                temperature=0.3,
                completion_token_limit=500,
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    try:
        save_spec_id(server_id, "web_spec", spec_id)
    except Exception as e:
        print(f"[WARN] DB save web_spec failed: {e}")
    return spec_id


async def query_graphlit_web(server_id: str, question: str) -> str:
    try:
        response = await graphlit.client.search_web(
            text=question,
            service=SearchServiceTypes.TAVILY,
            limit=5
        )
        result = response.search_web

        if result is None or result.results is None or len(result.results) == 0:
            response = await graphlit.client.search_web(
                text=question,
                service=SearchServiceTypes.EXA,
                limit=5
            )
            result = response.search_web

        if result is None or result.results is None or len(result.results) == 0:
            return "I don't know"

        context = ""
        for i, r in enumerate(result.results, 1):
            title = getattr(r, 'title', '')
            uri = getattr(r, 'uri', '')
            text = getattr(r, 'text', '')
            context += f"[{i}] {title}\nURL: {uri}\n{text}\n\n"

        prompt = (
            f"Using the following search results, answer this question: {question}\n\n"
            f"Search Results:\n{context}\n\n"
            f"Give a clear, concise answer under 1800 characters. Cite sources by number e.g. [1], [2]."
        )

        spec_id = await _get_or_create_web_spec(server_id)
        conv_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_web_query",
                specification=EntityReferenceInput(id=spec_id),
            )
        )
        answer_response = await graphlit.client.prompt_conversation(
            prompt=prompt,
            id=conv_response.create_conversation.id,
            specification=EntityReferenceInput(id=spec_id),
            mime_type=None,
            data=None,
            persona=None,
            system_prompt=None,
            tools=None,
            require_tool=None,
            include_details=True,
            correlation_id=None
        )
        result_msg = answer_response.prompt_conversation
        if result_msg is None or result_msg.message is None or result_msg.message.message is None:
            return "I don't know"
        return result_msg.message.message[:1800]

    except Exception as exc:
        print(f"[ERROR] query_graphlit_web: {exc}")
        return "Sorry, web search is temporarily unavailable. Please try again."