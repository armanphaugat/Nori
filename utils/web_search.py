from dotenv import load_dotenv
import os
import re
load_dotenv(override=True)
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from exa_py import Exa
from tavily import TavilyClient
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from utils.apikeyrotation import redis_client, random_key

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
EXA_API_KEY = os.getenv("EXA_API_KEY")

WEB_SEARCH_PROMPT = """System: You are a Precise Technical Assistant.
            Core Instruction: Answer ONLY using the provided Context. Do not use external knowledge.
            Rules:
            1. Context Check:
            -If answer exists in Context → Provide it with relevant citations.
            -If answer NOT in Context → Reply: "I don't have this information online either" (In user's language)
            2. No Hallucinations:
            - Never fabricate facts, examples, or details not in Context.
            - If uncertain, say so explicitly.
            3. Language Handling:
            - Detect user's question language automatically.
            - Respond in the SAME language as the question.
            - If user specifies a different language (e.g., "answer in Spanish"), use that language instead.
            - Maintain clarity: always prioritize user's language preference over context language.

            4. Citation & References:
            - Quote or reference specific sections from Context when possible.
            - Format: "According to [source], ..."
 
            5. Tone & Style:
            - Be concise, professional, and direct.
            - Avoid unnecessary elaboration.
            - Use bullet points only if context already uses them.
Context: {context}
User Question: {question}
Sources: {sources}
Response:"""

def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=redis_client.get("groq_active_key") or random_key()
    )

def search_tavily(question: str, max_results: int = 5):
    client = TavilyClient(api_key=TAVILY_API_KEY)
    response = client.search(question, max_results=max_results)
    results = response.get("results", [])
    if not results:
        raise ValueError("Tavily returned no results")
    context = []
    sources = []
    for r in results:
        context.append(r.get("content", ""))
        url = r.get("url", "")
        if url:
            sources.append(url)
    return "\n\n".join(context), sources


def search_exa(question: str, num_results: int = 5):
    client = Exa(api_key=EXA_API_KEY)
    response = client.search(
        question,
        type="auto",
        num_results=num_results,
        contents={"highlights": True}
    )
    if not response.results:
        raise ValueError("Exa returned no results")
    context = []
    sources = []
    for r in response.results:
        if r.highlights:
            context.append("\n".join(r.highlights))
        url = getattr(r, "url", "")
        if url:
            sources.append(url)
    return "\n\n".join(context), sources


def synthesize_answer(question: str, context: str, sources: list) -> str:
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(WEB_SEARCH_PROMPT)
    chain = prompt | llm | StrOutputParser()
    sources_str = "\n".join(f"- {url}" for url in sources)
    answer = chain.invoke({
        "context": context,
        "sources": sources_str,
        "question": question
    })
    return f"Web Search Result (not from knowledge base):\n\n{answer}"

def web_search_fallback(question: str) -> str | None:
    if TAVILY_API_KEY:
        try:
            context, sources = search_tavily(question)
            print(f"Web search succeeded via Tavily for: {question[:60]}")
            return synthesize_answer(question, context, sources)
        except Exception as e:
            print(f"Tavily search failed: {e}")

    if EXA_API_KEY:
        try:
            context, sources = search_exa(question)
            print(f"Web search succeeded via Exa AI for: {question[:60]}")
            return synthesize_answer(question, context, sources)
        except Exception as e:
            print(f"Exa AI search failed: {e}")

    if not TAVILY_API_KEY and not EXA_API_KEY:
        print("No web search API keys configured (TAVILY_API_KEY / EXA_API_KEY)")
    else:
        print("All web search providers failed")
    return None
