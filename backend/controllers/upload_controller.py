import asyncio
import re
import sys
import os
from io import BytesIO
from typing import List, Optional

from fastapi import File, Form, HTTPException, Query, UploadFile

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.ingest import create_vectorstore, read_pdf, read_word, read_ocr, read_video, split_texts, webscraper
from python.sub_urls import get_sub_urls
from python.contacts.xlsx_contacts import ingest_contacts_to_vectorstore
from dbhelper.db_helper import get_all_uploads
from backend.middleware.auth import *

URL_PATTERN     = r"(https?://[^\s]+)"
MAX_FILE_SIZE   = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp", ".mp4", ".mp3", ".wav", ".m4a"}

async def handle_get_sub_urls(url: str = Query(...),user:dict=Depends(verify_access_token),) -> dict:
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="'url' query parameter is required")
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, get_sub_urls, url)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[handle_get_sub_urls] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sub-URLs")


async def handle_upload(#do not touch (aayushi work)
    guild_id: str                        = Form(...),
    files:    Optional[List[UploadFile]] = File(None),
    urls:     Optional[str]              = Form(None),
    user:     dict                       = Depends(require_guild_admin),
    
) -> dict:
    guild_id = guild_id.strip()
    print(f"[DEBUG] guild_id={guild_id!r}")
    print(f"[DEBUG] urls={urls!r}")
    print(f"[DEBUG] files={[f.filename for f in (files or [])]}")
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")

    valid_files = [f for f in (files or []) if f.filename]
    for f in valid_files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'")
        f.file.seek(0, 2)
        size = f.file.tell()
        f.file.seek(0)
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File must be smaller than 10 MB")

    links = re.findall(URL_PATTERN, urls) if urls else []
    if not valid_files and not links:
        raise HTTPException(status_code=400, detail="No PDFs or URLs provided")

    texts: list[str] = []

    for link in links:
        try:
            scraped = webscraper(link)
            if scraped:
                texts.extend(scraped)
        except Exception as e:
            print(f"[handle_upload] Scrape error for {link}: {e}")
    
    pdf_count = word_count = ocr_count = video_count = 0

    for upload in valid_files:
        ext = os.path.splitext(upload.filename or "")[1].lower()
        try:
            file_bytes = await upload.read()
            if not file_bytes:
                print(f"[handle_upload] Empty file: {upload.filename}")
                continue
            bio = BytesIO(file_bytes)
            if ext == ".pdf":
                text = read_pdf(bio)
                pdf_count += 1
            elif ext == ".docx":
                text = read_word(bio)
                word_count += 1
            elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
                text = read_ocr(bio)
                ocr_count += 1
            elif ext in {".mp4", ".mp3", ".wav", ".m4a"}:
                text = read_video(bio)
                video_count += 1
            else:
                continue

            if text:
                cleaned = split_texts([text])
                texts.extend(cleaned)

        except Exception as e:
            print(f"[handle_upload] Processing {upload.filename} failed: {e}")

    if not texts:
        raise HTTPException(status_code=400, detail="No valid content extracted")

    try:
        chunks = split_texts(texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text splitting failed: {e}")

    try:
        created = create_vectorstore(chunks, guild_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector store creation failed: {e}")

    if not created:
        raise HTTPException(status_code=500, detail="Vector store creation returned falsy")

    return {
        "status":          "success",
        "message":         f"Processed {len(chunks)} chunks",
        "urls_processed":  len(links),
        "pdfs_processed": pdf_count,
        "word_processed": word_count,
        "ocr_processed":  ocr_count,
        "video_processed": video_count,
    }
# add new endpoint for raw txt string 
async def handle_upload_faq(guild_id: str=Form(...),text:str=Form(...),user: dict = Depends(require_guild_admin),)-> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' is required")
    if not text:
        raise HTTPException(status_code=400, detail="'guild_id' is required")
async def handle_upload_contacts(guild_id: str        = Form(...),file:     UploadFile = File(...),user: dict = Depends(require_guild_admin),) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' is required")

    if not (file.filename or "").endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are accepted")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        loop   = asyncio.get_running_loop()
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
            "message": f"Ingested {result['rows']} faculty records as {result['chunks']} chunks",
            "rows":    result["rows"],
            "chunks":  result["chunks"],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[handle_upload_contacts] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest contacts: {e}")


async def handle_get_all_uploads(guild_id: str = Query(...),user:dict = Depends(require_guild_admin_query),) -> dict:
    try:
        result = get_all_uploads(guild_id)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to retrieve uploads")
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve uploads: {e}")