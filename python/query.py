from dotenv import load_dotenv
import os
import re
load_dotenv(override=True)

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
import redis as r
import sys
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
from utils.apikeyrotation import rotate_key, get_key, set_key,random_key
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=r.get("groq_active_key") or random_key()
    )
    
from langchain_core.prompts import ChatPromptTemplate
prompt_string = "" 
def checker(discord_prompt: str):
    global prompt_string
    if discord_prompt is not None:
        prompt_string = discord_prompt
full_prompt = ChatPromptTemplate.from_template("{text}")
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
def get_hybrid_retriever(server_id, bm25_k,faiss_k,faiss_fetch_k=45):
    vectorstore = get_vectorstore(server_id)
    if vectorstore is None:
        return None
    all_docs = get_all_docs(server_id)
    if not all_docs:
        return None
    bm25_retriever = BM25Retriever.from_documents(all_docs, k=bm25_k)
    faiss_retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": faiss_k, "fetch_k": faiss_fetch_k, "lambda_mult": 0.4}
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


def answer_query(question: str, server_id: int,discord_prompt:str):
    checker(discord_prompt)
    vectorstore = get_vectorstore(server_id)
    llm=get_llm()
    if vectorstore is None:
        return "No content has been uploaded yet. Use -upload with URLs or PDF attachments first."

    retriever = get_hybrid_retriever(server_id)
    if retriever is None:
        return "No content has been uploaded yet. Use -upload with URLs or PDF attachments first."
    docs = retriever(question)
    context = format_docs(docs)
    chain = full_prompt | llm | StrOutputParser()
    return chain.invoke({"context": context, "question": question})