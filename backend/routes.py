from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from io import BytesIO
import sys
import os
import asyncio
import re
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from python.ingest import webscraper, split_texts, create_vectorstore, read_pdf
from python.query import answer_query
from python.sub_urls import get_sub_urls
from python.contacts.xlsx_contacts import ingest_contacts_to_vectorstore
from dbhelper.db_helper import *
url_pattern = r"(https?://[^\s]+)"

@app.get("/sub-urls")
async def sub_urls_api(url: str):
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="'url' query parameter is required.")
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, get_sub_urls, url)
        return result
    except Exception as e:
        print(f"[sub_urls_api] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sub-URLs.")

@app.get("/")
def home():
    return {"message": "RAG API running"}
@app.post("/query")
async def query_api(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    question = (data.get("question") or "").strip()
    server = (data.get("server") or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="'question' is required.")
    if not server:
        raise HTTPException(status_code=400, detail="'server' is required.")

    try:
        loop = asyncio.get_running_loop()
        answer = await loop.run_in_executor(None, answer_query, question, server)
        return {"answer": answer}
    except Exception as e:
        print(f"[query_api] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query.")
@app.put("/upload")
async def upload_api(
    guild_id: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    urls: Optional[str] = Form(None),
):
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty.")

    pdf_files = [f for f in (files or []) if f.filename]
    for f in pdf_files:
        f.file.seek(0, 2)
        size = f.file.tell()
        f.file.seek(0)  
        if(size>10*1024*1024):
            raise HTTPException(status_code=400, detail="Please Upload File less Than 10MB")
    links = re.findall(url_pattern, urls) if urls else []
    if not pdf_files and not links:
        raise HTTPException(status_code=400, detail="No PDFs or URLs provided.")
    texts = []
    for link in links:
        try:
            scraped_text = webscraper(link)
            if scraped_text:
                texts.extend(scraped_text)
        except Exception as e:
            print(f"[upload] Scrape error for {link}: {e}")

    for pdf in pdf_files:
        try:
            file_bytes = await pdf.read()
            if not file_bytes:
                print(f"[upload] Empty file: {pdf.filename}")
                continue
            pdf_text = read_pdf(BytesIO(file_bytes))
            if pdf_text:
                texts.append(pdf_text)
        except Exception as e:
            print(f"[upload] PDF read error for {pdf.filename}: {e}")

    if not texts:
        raise HTTPException(status_code=400, detail="No valid content extracted.")
    try:
        chunked_text = split_texts(texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text splitting failed: {e}")

    try:
        created_vector = create_vectorstore(chunked_text, guild_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector store creation failed: {e}")

    if not created_vector:
        raise HTTPException(status_code=500, detail="Vector store creation returned falsy.")
    return {
        "status": "success",
        "message": f"Processed {len(chunked_text)} chunks",
        "urls_processed": len(links),
        "pdfs_processed": len(pdf_files),
    }

@app.put("/upload-contacts")
async def upload_contacts_api(
    guild_id: str = Form(...),
    file: UploadFile = File(...),
):
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' is required.")

    filename = file.filename or ""
    if not filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are accepted.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        from io import BytesIO
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            ingest_contacts_to_vectorstore,
            BytesIO(contents),
            guild_id,
        )

        if result["status"] != "success":
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "status":  "success",
            "message": f"Ingested {result['rows']} faculty records as {result['chunks']} chunks into knowledge base.",
            "rows":    result["rows"],
            "chunks":  result["chunks"],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[upload_contacts] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest contacts: {e}")
    
@app.post("/add-sever")
async def add_server_endpoint(guild_id:str =Form(...),name:str=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if name is None:
        raise HTTPException(status_code=400,detail="Name is Required")
    try:
        add_server(guild_id,name)
        return {
            "status":  "success",
            "message": "Server Added SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Add Server {e}")
@app.patch("/update-faiss-k")
async def update_faiss(guild_id:str =Form(...),k:int=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if k<=0:
        raise HTTPException(status_code=400,detail="K value must be Greater Than Zero")
    try:
        result=update_faiss_k(guild_id,k)
        if result==1:
            return {
                "status":  "success",
                "message": "Faiss-k Updated SuccessFully"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Server not found or no update was made"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Update Faiss-K {e}")
    
@app.patch("/update-bm25-k")
async def update_bm25(guild_id:str =Form(...),k:int=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if k<=0:
        raise HTTPException(status_code=400,detail="K value must be Greater Than Zero")
    try:
        result=update_bm25_k(guild_id,k)
        if result==1:
            return {
                "status":  "success",
                "message": "Bm25-k Updated SuccessFully"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Server not found or no update was made"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Update Bm25-K {e}")

@app.patch("/update-temperature")
async def update_temp(guild_id:str =Form(...),k:int=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if k<0 and k>1:
        raise HTTPException(status_code=400,detail="K value must be Between 0 & 1")
    try:
        result=update_temperature(guild_id,k)
        if result==1:
            return {
                "status":  "success",
                "message": "Temp Updated SuccessFully"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Server not found or no update was made"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Temperature {e}")

@app.patch("/update-chunk-size")
async def update_chunk(guild_id:str =Form(...),k:int=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if k<=0 and k>=1000:
        raise HTTPException(status_code=400,detail="K value must be Between 1 & 1000")
    try:
        result=update_chunk_size(guild_id,k)
        if result==1:
            return {
                "status":  "success",
                "message": "Chunk Size Updated SuccessFully"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Server not found or no update was made"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Udpate Chunk Size {e}")
    
@app.patch("/update-chunk-overlap")
async def update_chunk_over(guild_id:str =Form(...),k:int=Form(...)):
    if guild_id is None:
        raise HTTPException(status_code=400,detail="Guild Id is Required")
    if k<100 and k>1000:
        raise HTTPException(status_code=400,detail="K value must be Between 100 & 1000")
    try:
        result=update_chunk_overlap(guild_id,k)
        if result==1:
            return {
                "status":  "success",
                "message": "Chunk  OverLap Updated SuccessFully"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Server not found or no update was made"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Udpate Chunk Overlap {e}")
    
@app.put("/insert-system-prompt")
async def insert_prompt(guild_id:str =Form(...),text:str=Form(...)):
    try:
        insert_system_prompt(guild_id,text)
        return {
            "status":"sucess",
            "message":"System Prompt Inserted SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Insert The System Prompt{e}")

@app.put("/update-system-prompt")
async def update_prompt(guild_id:str =Form(...),text:str=Form(...)):
    try:
        update_system_prompt(guild_id,text)
        return {
            "status":"sucess",
            "message":"System Prompt Updated SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Update The System Prompt{e}")
    
@app.patch("/update-max-token")
async def update_token(guild_id:str =Form(...),k:int=Form(...)):
    try:
        result=update_max_tokens(guild_id,k)
        if result==1:
            return {
            "status":"sucess",
            "message":"System Prompt Updated SuccessFully"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Failed to Update The Max Token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Update The Max Token{e}")
    
@app.put("/add-channel")
async def add_channel(guild_id:str =Form(...),channel_id:List=Form(...)):#in which bot respond automatically
    try:
        for channel in channel_id:
            set_channel(guild_id,channel)
        return {
            "status":"sucess",
            "message":"Channel Inserted SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Insert The Channel{e}")

@app.delete("/delete-channel")
async def del_channel(guild_id:str =Form(...),channel_id:str=Form(...)):
    try:
        remove_channel(guild_id,channel_id)
        return {
            "status":"sucess",
            "message":"Channel Deleted SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Delete The Channel{e}")
    
@app.put("/add-mod-channel")
async def add_mod_channel(guild_id:str =Form(...),channel_id:str=Form(...)):
    try:
        insert_mod_channel(guild_id,channel_id)
        return {
            "status":"sucess",
            "message":"Mod Channel Added SuccessFully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Add Mod Channel{e}")
    
@app.get("/get-all-uploads")
async def get_all_upload(guild_id:str =Form(...)):
    try:
        result=get_all_upload(guild_id)
        if result is None:
            raise HTTPException(status_code=500, detail=f"Failed to get All Uploads")
        else:
            return {
                "status":"sucess",
                "message":"Mod Channel Added SuccessFully"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to Add Mod Channel{e}")
    
@app.get("/analytics-summary")
async def get_analytics_summary_endpoint(guild_id: str = Form(...)):
    if not guild_id.strip():
        raise HTTPException(status_code=400, detail="'guild_id' is required.")
    try:
        summary = get_analytics_summary(guild_id)
        if not summary:
            raise HTTPException(status_code=404, detail="No analytics found for this server.")
        return {
            "status": "success",
            "data": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics summary: {e}")