import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from dbhelper.db_helper import *
from graphlit import Graphlit
from graphlit_api import *
from utils.apikeyrotation import *

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

SMALL_TALK = {"hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye", "ok", "okay"}

def is_small_talk(question: str) -> bool:
    return question.strip().lower() in SMALL_TALK



def build_kb_system_prompt(language: str = "english", tone: str = "professional") -> str:
    return f"""
You are a helpful AI assistant for a support knowledge base.
Always respond in {language}.
Your tone should be {tone}.

CONVERSATION HANDLING:
- For greetings (e.g. "hi", "hello", "hey"): respond warmly and invite the user to ask a question
- For thanks or farewells (e.g. "thank you", "bye", "that's all"): respond naturally and {tone}ly
- For small talk or non-question statements: engage briefly and redirect toward how you can help
- For compliments or feedback: acknowledge them graciously
These conversational responses do NOT require citing sources.

CRITICAL INSTRUCTION (for knowledge base questions only):
If the answer cannot be found in the provided documents or knowledge base,
you MUST respond with EXACTLY this phrase (no variations):
"I don't have this information"

Do NOT add any explanation, apology, or additional text to that phrase.
Just respond with: I don't have this information

If you DO have the answer in the knowledge base:
1. Provide a clear, accurate answer
2. Cite the source document/page where the information comes from
3. Keep your answer concise and under 1800 characters
4. Use bullet points or numbered lists for clarity if appropriate

RULES:
- Be helpful and {tone}
- Always cite your sources when answering from the knowledge base
- Never make up information
- Never provide generic advice when specific KB content exists
- Stick to the knowledge base content only for factual/support questions
- Always respond in {language}
"""


def build_web_system_prompt(language: str = "english", tone: str = "professional") -> str:
    return f"""
You are a helpful AI assistant with access to real-time web search.
Always respond in {language}.
Your tone should be {tone}.

CONVERSATION HANDLING:
- For greetings (e.g. "hi", "hello", "hey"): respond warmly and invite the user to ask a question
- For thanks or farewells (e.g. "thank you", "bye", "that's all"): respond naturally and {tone}ly
- For small talk or non-question statements: engage briefly and redirect toward how you can help
- For compliments or feedback: acknowledge them graciously
These conversational responses do NOT require web searches or citations.

CRITICAL INSTRUCTION (for informational questions only):
If the web search returns no relevant results or the query cannot be answered,
you MUST respond with EXACTLY this phrase (no variations):
"I don't have this information"

Do NOT add any explanation, apology, or additional text to that phrase.
Just respond with: I don't have this information

If you DO find relevant results from the web:
1. Provide a clear, accurate answer based on search results
2. Cite your sources with the URL or site name
3. Keep your answer concise and under 1800 characters
4. Use bullet points or numbered lists for clarity if appropriate

RULES:
- Be helpful and {tone}
- Always cite your sources when answering from web search
- Never make up information or fabricate URLs
- Prefer recent and authoritative sources
- Always respond in {language}
"""

async def get_or_create_kb_spec(server_id: str, language: str, tone: str) -> str:
    existing_spec_id = get_kb_spec_id(server_id)
    if existing_spec_id:
        return existing_spec_id
    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_kb_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.GROQ,
            system_prompt=build_kb_system_prompt(language, tone),
            retrieval_strategy=RetrievalStrategyInput(
                type=RetrievalStrategyTypes.CONTENT,
                content_limit=5,
            ),
            groq=GroqModelPropertiesInput(
                model=GroqModels.LLAMA_3_3_70B,
                temperature=0.2,
                completion_token_limit=1000,
                api_key=get_key(),
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    save_spec_id(server_id, "kb", spec_id)
    return spec_id


async def get_or_create_web_spec(server_id: str, language: str, tone: str) -> str:
    existing_spec_id = get_web_spec_id(server_id)
    if existing_spec_id:
        return existing_spec_id

    spec_response = await graphlit.client.create_specification(
        specification=SpecificationInput(
            name=f"{server_id}_web_spec",
            type=SpecificationTypes.COMPLETION,
            service_type=ModelServiceTypes.GROQ,
            system_prompt=build_web_system_prompt(language, tone),
            groq=GroqModelPropertiesInput(
                model=GroqModels.LLAMA_3_3_70B,
                temperature=0.3,
                completion_token_limit=500,
                api_key=get_key(),
            ),
        )
    )
    spec_id = spec_response.create_specification.id
    save_spec_id(server_id, "web", spec_id)
    return spec_id

async def query_graphlit(server_id: str, question: str, language: str = "english", tone: str = "professional", prv_messages: str = "") -> str:
    print("Query Graphlit Called")
    if is_small_talk(question):
        return "Hello! How can I help you today?"
    try:
        content_ids = get_content_ids(server_id)
        feed_ids = get_feed_ids(server_id)
    except Exception as e:
        print(f"[WARN] DB fetch content/feed ids failed: {e}")
        content_ids, feed_ids = [], []
    if not content_ids and not feed_ids:
        return "No knowledge base found for this server."
    spec_id = await get_or_create_kb_spec(server_id, language, tone)
    conversation_id = None
    try:
        conv_response = await graphlit.client.create_conversation(
            conversation=ConversationInput(
                name=f"{server_id}_kb_query",
                specification=EntityReferenceInput(id=spec_id),
                filter=ContentCriteriaInput(
                    contents=[EntityReferenceInput(id=cid) for cid in content_ids] if content_ids else None,
                    feeds=[EntityReferenceInput(id=fid) for fid in feed_ids] if feed_ids else None
                )
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
            correlation_id=None
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


async def query_graphlit_web(server_id: str, question: str, language: str = "english", tone: str = "professional", prv_messages: str = "") -> str:
    print("Query Web-Graphlit Called")
    if is_small_talk(question):
        return "Hello! How can I help you today?"
    conversation_id = None
    try:
        response = await graphlit.client.search_web(
            text=question,
            service=SearchServiceTypes.TAVILY,
            limit=3
        )
        result = response.search_web
        if result is None:
            response = await graphlit.client.search_web(
                text=question,
                service=SearchServiceTypes.EXA,
                limit=3
            )
            result = response.search_web
        if result is None or result.results is None or len(result.results) == 0:
            return "I don't have this information"
        context = ""
        for i, r in enumerate(result.results, 1):
            title = getattr(r, 'title', '')
            uri = getattr(r, 'uri', '')
            text = getattr(r, 'text', '')
            context += f"[{i}] {title}\nURL: {uri}\n{text}\n\n"
        prompt = f"Question: {question}\n\n"
        if prv_messages:
            prompt = f"Conversation context:\n{prv_messages}\n\nQuestion: {question}\n\n"
        prompt += (
            f"Using the following search results, answer the question above.\n\n"
            f"Search Results:\n{context}\n\n"
            f"Give a clear, concise answer under 1800 characters. Cite sources by number e.g. [1], [2]."
        )
        spec_id = await get_or_create_web_spec(server_id, language, tone)
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
            correlation_id=None
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