import asyncio
import re
import sys
import os
from io import BytesIO
from typing import List, Optional

URL_PATTERN = r"(https?://[^\s]+)"
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx",
    ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp",
    ".mp4", ".mp3", ".wav", ".m4a",
    ".xlsx", ".xls",
}

from fastapi import File, Form, HTTPException, Query, UploadFile, Depends

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from python.ingest import *
from python.sub_urls import *
from python.deletion import *
from dbhelper.db_helper import *
from backend.middleware.auth import *


async def handle_get_all_uploads(
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> list:
    return get_all_uploads(guild_id)


async def handle_get_sub_urls(
    url: str = Query(...),
    user: dict = Depends(verify_access_token),
) -> dict:
    url = url.strip()
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    result = get_sub_urls(url)
    if result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


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
        feed_id = await add_website_graphlit(guild_id, url)
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            feed_id=feed_id,
            content_id=None,
            status="ok",
        )
        return {"status": "success", "message": "Website feed created"}
    except Exception as e:
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_website] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create website feed")


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
        content_id = await add_url_graphlit(guild_id, url)
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            content_id=content_id,
            status="ok",
        )
        return {"status": "success", "message": "URL ingested"}
    except Exception as e:
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_url] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest URL")


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
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file.file.seek(0, 2)
    if file.file.tell() > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be smaller than 10 MB")
    file.file.seek(0)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # derive upload kind for logging
    if ext in {".xlsx", ".xls"}:
        kind = "pdf"   # reuse closest type or add "xlsx" to your uploads CHECK constraint
    elif ext == ".docx":
        kind = "pdf"   # same — extend the constraint if you want exact types
    else:
        kind = "pdf"

    try:
        content_id = None

        if ext == ".pdf":
            content_id = await add_pdf_graphlit(guild_id, file_bytes)

        elif ext == ".docx":
            content_id = await add_word_graphlit(guild_id, BytesIO(file_bytes))

        elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
            content_id = await add_image_graphlit(guild_id, BytesIO(file_bytes))

        elif ext in {".mp4", ".mp3", ".wav", ".m4a"}:
            content_id = await add_video_graphlit(guild_id, BytesIO(file_bytes))
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="pdf",
            name=file.filename,
            content_id=content_id,
            status="ok",
        )
        return {"status": "success", "message": f"{ext} ingested", "type": ext.lstrip(".")}

    except HTTPException:
        raise
    except Exception as e:
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="pdf",
            name=file.filename,
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_file] {file.filename} failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")


async def handle_upload_faq(
    guild_id: str = Form(...),
    faq_text: str = Form(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    faq_text = faq_text.strip()
    if not faq_text:
        raise HTTPException(status_code=400, detail="'faq_text' cannot be empty")
    try:
        content_id = await add_text_graphlit(guild_id, faq_text)
        if not content_id:
            raise HTTPException(status_code=500, detail="Failed to store FAQ text")
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="pdf",
            name=faq_text[:80],
            content_id=content_id,
            status="ok",
        )
        return {"status": "success", "message": "FAQ ingested"}
    except HTTPException:
        raise
    except Exception as e:
        log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="pdf",
            name=faq_text[:80],
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_faq] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest FAQ")



async def handle_delete_upload(
    upload_id: str,
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin),
) -> dict:
    try:
        row = get_upload_by_id(upload_id, guild_id)
        if not row:
            raise HTTPException(status_code=404, detail="Upload not found")

        feed_id = row.get("feed_id")
        content_id = row.get("content_id")

        if feed_id:
            success = await delete_feed_graphlit(feed_id)
            if not success:
                raise HTTPException(status_code=502, detail="Failed to delete feed from Graphlit")
            remove_feed_id(guild_id, feed_id)
        elif content_id:
            success = await delete_content_graphlit(content_id)
            if not success:
                raise HTTPException(status_code=502, detail="Failed to delete content from Graphlit")
            remove_content_id(guild_id, content_id)

        deleted = remove_upload(upload_id, guild_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Upload not found in DB")

        return {"status": "success", "deleted_id": upload_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[handle_delete_upload] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete upload")