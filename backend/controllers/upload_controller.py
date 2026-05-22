import asyncio
import re
import sys
import os
from io import BytesIO
from typing import List, Optional

from fastapi import File, Form, HTTPException, Query, UploadFile

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.ingest import *
from python.sub_urls import get_sub_urls
from python.contacts.xlsx_contacts import ingest_contacts_to_vectorstore
from dbhelper.db_helper import get_all_uploads
from backend.middleware.auth import *
from dbhelper.db_helper import get_all_uploads, remove_upload

# handle_upload_website — calls add_website_graphlit (creates a recurring feed)
async def handle_upload_website(
    guild_id: str = Form(...),
    url: str = Form(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    url = url.strip()
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    try:
        await add_website_graphlit(guild_id, url)
        return {"status": "success", "message": "Website feed created"}
    except Exception as e:
        print(f"[handle_upload_website] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create website feed")


# handle_upload_url — calls add_url_graphlit (one-shot URI ingest)
async def handle_upload_url(
    guild_id: str = Form(...),
    url: str = Form(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    url = url.strip()
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    try:
        await add_url_graphlit(guild_id, url)
        return {"status": "success", "message": "URL ingested"}
    except Exception as e:
        print(f"[handle_upload_url] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest URL")


# handle_upload_file — pdf / docx / image / video only (no URLs)
async def handle_upload_file(
    guild_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'")

    file.file.seek(0, 2)
    if file.file.tell() > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be smaller than 10 MB")
    file.file.seek(0)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        if ext == ".pdf":
            await add_pdf_graphlit(guild_id, file_bytes)
        elif ext == ".docx":
            await add_word_graphlit(guild_id, BytesIO(file_bytes))
        elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
            await add_image_graphlit(guild_id, BytesIO(file_bytes))
        elif ext in {".mp4", ".mp3", ".wav", ".m4a"}:
            await add_video_graphlit(guild_id, BytesIO(file_bytes))
        return {"status": "success", "message": f"{ext} ingested", "type": ext.lstrip(".")}
    except Exception as e:
        print(f"[handle_upload_file] {file.filename} failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")