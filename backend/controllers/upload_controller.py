import asyncio
import re
import sys
import os
from io import BytesIO
from typing import List, Optional

from fastapi import File, Form, HTTPException, Query, UploadFile

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.ingest import create_vectorstore, read_pdf, split_texts, webscraper
from python.sub_urls import get_sub_urls
from python.contacts.xlsx_contacts import ingest_contacts_to_vectorstore
from dbhelper.db_helper import get_all_uploads

URL_PATTERN     = r"(https?://[^\s]+)"
MAX_FILE_SIZE   = 10 * 1024 * 1024   # 10 MB

async def handle_get_sub_urls(url: str = Query(...)) -> dict:
    url = url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="'url' query parameter is required")
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")

    try:
        loop   = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, get_sub_urls, url)
        return result
    except Exception as e:
        print(f"[handle_get_sub_urls] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sub-URLs")


async def handle_upload(
    guild_id: str                        = Form(...),
    files:    Optional[List[UploadFile]] = File(None),
    urls:     Optional[str]              = Form(None),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")

    pdf_files = [f for f in (files or []) if f.filename]
    for f in pdf_files:
        f.file.seek(0, 2)
        size = f.file.tell()
        f.file.seek(0)
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File must be smaller than 10 MB")

    links = re.findall(URL_PATTERN, urls) if urls else []
    if not pdf_files and not links:
        raise HTTPException(status_code=400, detail="No PDFs or URLs provided")

    texts: list[str] = []

    for link in links:
        try:
            scraped = webscraper(link)
            if scraped:
                texts.extend(scraped)
        except Exception as e:
            print(f"[handle_upload] Scrape error for {link}: {e}")

    for pdf in pdf_files:
        try:
            file_bytes = await pdf.read()
            if not file_bytes:
                print(f"[handle_upload] Empty file: {pdf.filename}")
                continue
            pdf_text = read_pdf(BytesIO(file_bytes))
            if pdf_text:
                texts.append(pdf_text)
        except Exception as e:
            print(f"[handle_upload] PDF read error for {pdf.filename}: {e}")

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
        "pdfs_processed":  len(pdf_files),
    }


async def handle_upload_contacts(
    guild_id: str        = Form(...),
    file:     UploadFile = File(...),
) -> dict:
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


async def handle_get_all_uploads(guild_id: str = Query(...)) -> dict:
    try:
        result = get_all_uploads(guild_id)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to retrieve uploads")
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve uploads: {e}")