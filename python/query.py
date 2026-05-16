from dotenv import load_dotenv
import os
import re
import sys
load_dotenv(override=True)

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
import redis as r
from utils.apikeyrotation import redis_client, random_key
from utils.web_search import web_search_fallback
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
from utils.apikeyrotation import rotate_key, get_key, set_key,random_key
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key = redis_client.get("groq_active_key") or random_key()
    )
text = """System: You are a Precise Technical Assistant.
 
Core Instruction: Answer ONLY using the provided Context. Do not use external knowledge. Must be 4000 or fewer in length.
 
Rules:
1. Context Check:
   - If answer exists in Context → Provide it with relevant citations.
   - If answer NOT in Context → Reply: "I don't have this information in the provided documentation." (In user's language)
   
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
   - Format: "According to [section/document], ..."
 
5. Tone & Style:
   - Be concise, professional, and direct.
   - Avoid unnecessary elaboration.
   - Use bullet points only if context already uses them.
 
Context: {context}
 
User Question: {question}
 
Response:"""
def checker(discord_prompt: str):
    if discord_prompt is not None:
        global text
        text = f'"""{discord_prompt}"""'
    else:
        text = """System: You are a Precise Technical Assistant.
            Core Instruction: Answer ONLY using the provided Context. Do not use external knowledge.
            Rules:
            1. Context Check:
            -If answer exists in Context → Provide it with relevant citations.
            -If answer NOT in Context → Reply: "I don't have this information in the provided documentation." (In user's language)
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
            - Format: "According to [section/document], ..."
 
            5. Tone & Style:
            - Be concise, professional, and direct.
            - Avoid unnecessary elaboration.
            - Use bullet points only if context already uses them.
Context: {context}
User Question: {question}
Response:"""

_vectorstore_cache: dict = {}
_docs_cache: dict = {} 
def get_db_dir(server_id):
    return f"vectorstore/{str(server_id)}/faiss_index"

def get_vectorstore(server_id):
    server_id_str = str(server_id)
    if server_id_str not in _vectorstore_cache:
        vs = load_vectorstore(server_id)
        if vs is None:
            return None
        _vectorstore_cache[server_id_str] = vs
    return _vectorstore_cache[server_id_str]

def invalidate_cache(server_id):
    _vectorstore_cache.pop(str(server_id), None)
    _docs_cache.pop(str(server_id), None)

def load_vectorstore(server_id):
    DB_DIR = get_db_dir(server_id)
    if not os.path.exists(os.path.join(DB_DIR, "index.faiss")):
        print(f"Vectorstore not found at {DB_DIR}")
        return None
    return FAISS.load_local(
        DB_DIR,
        embeddings,
        allow_dangerous_deserialization=True
    )
def get_all_docs(server_id):
    server_id_str=str(server_id)
    if(server_id_str not in _docs_cache):
        vs=get_vectorstore(server_id)
        if vs is None:
            return []
        docs=list(vs.docstore._dict.values())
        _docs_cache[server_id_str]=docs
    return _docs_cache[server_id_str]
def get_hybrid_retriever(server_id, discord_bm25_k,discord_faiss_k,discord_faiss_fetch_k=45):
    vectorstore = get_vectorstore(server_id)
    if vectorstore is None:
        return None
    all_docs = get_all_docs(server_id)
    if not all_docs:
        return None
    bm25_retriever = BM25Retriever.from_documents(all_docs, k=discord_bm25_k)
    faiss_retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": discord_faiss_k}
    )
    def hybrid_retrieve(query):
        bm25_docs = bm25_retriever.invoke(query)
        faiss_docs = faiss_retriever.invoke(query)
        seen = set()
        merged = []
        for doc in bm25_docs + faiss_docs:
            key = doc.page_content[:100]
            if key not in seen:
                seen.add(key)
                merged.append(doc)
        return merged
    return hybrid_retrieve
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def is_no_kb_response(answer: str) -> bool:

    no_kb_phrases = [
        "i don't have this information",
        "i do not have this information",
        "not in the provided documentation",
        "not available in the provided",
    ]
    lower = answer.lower()
    return any(phrase in lower for phrase in no_kb_phrases)

def answer_query(question: str, server_id: int, discord_prompt: str, discord_bm25_k: int, discord_faiss_k: int) -> str:
    checker(discord_prompt)
    full_prompt = ChatPromptTemplate.from_template(text)
    vectorstore = get_vectorstore(server_id)
    llm = get_llm()
    if vectorstore is None:
        return web_search_fallback(question) or "No content has been uploaded yet. Use -upload with URLs or attachments first."
    retriever = get_hybrid_retriever(server_id, discord_bm25_k, discord_faiss_k, 45)
    if retriever is None:
        return web_search_fallback(question) or "No content has been uploaded yet. Use -upload with URLs or attachments first."
    docs = retriever(question)
    context = format_docs(docs)
    chain = full_prompt | llm | StrOutputParser()
    ans = chain.invoke({"context": context, "question": question})
    if is_no_kb_response(ans):
        return web_search_fallback(question) or ans
    return ans