import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from graphlit import Graphlit
from graphlit_api import *
from dbhelper.db_helper import *
graphlit = Graphlit()
KB_SYSTEM_PROMPT = (
    "You are a helpful assistant. Always cite which document or source "
    "your answer comes from. If the answer is not found in the provided "
    "documents, say 'I don't know'."
)
WEB_SYSTEM_PROMPT = (
    "You are a helpful assistant. Search the web and answer clearly. "
    "Always cite your sources."
)
async def _get_or_create_kb_spec(server_id: str) -> str:
    spec_id = get_kb_spec_id(server_id)
    if spec_id:
        return spec_id

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
    save_spec_id(server_id, "kb_spec", spec_id)
    return spec_id

async def _get_or_create_web_spec(server_id: str) -> str:
    spec_id = get_web_spec_id(server_id)
    if spec_id:
        return spec_id
    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_web_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.OPEN_AI,
            system_prompt=WEB_SYSTEM_PROMPT,
            open_ai=OpenAIModelPropertiesInput(
                model=OpenAIModels.GPT4O_128K,
                temperature=0.2,
                completion_token_limit=1000,
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    save_spec_id(server_id, "web_spec", spec_id)
    return spec_id

async def query_graphlit(server_id: str, question: str) -> str:
    try:
        content_ids = await get_content_ids(server_id)
        feed_ids = await get_feed_ids(server_id)

        if not content_ids and not feed_ids:
            return "No knowledge base found for this server."

        spec_id = await _get_or_create_kb_spec(server_id)

        content_filter = {"contents": [{"id": cid} for cid in content_ids]} if content_ids else {}
        feed_filter = {"feeds": [{"id": fid} for fid in feed_ids]} if feed_ids else {}

        conversation_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_kb_query",
                specification=EntityReferenceInput(id=spec_id),
                filter={**content_filter, **feed_filter},
            )
        )
        conversation_id = conversation_response.create_conversation.id

        response = await graphlit.client.prompt_conversation(
            prompt=question,
            id=conversation_id,
            specification=EntityReferenceInput(id=spec_id),
            include_details=True,
        )
        answer = response.prompt_conversation.message.message
        return answer[:4000] if len(answer) > 4000 else answer

    except Exception as e:
        print(f"[{server_id}] KB query failed: {e}")
        raise

async def query_graphlit_web(server_id: str, question: str) -> str:
    try:
        spec_id = await _get_or_create_web_spec(server_id)

        conversation_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_web_query",
                specification=EntityReferenceInput(id=spec_id),
            )
        )
        conversation_id = conversation_response.create_conversation.id

        response = await graphlit.client.prompt_conversation(
            prompt=question,
            id=conversation_id,
            specification=EntityReferenceInput(id=spec_id),
            include_details=True,
        )
        answer = response.prompt_conversation.message.message
        return answer[:4000] if len(answer) > 4000 else answer

    except Exception as e:
        print(f"[{server_id}] Web query failed: {e}")
        raise