import asyncio
import re
import sys
import os
from io import BytesIO
from typing import List, Optional
from bot.bot import get_message_from_channel
import threading
lock = threading.Lock()
from dbhelper.db_helper import *
URL_PATTERN = r"(https?://[^\s]+)"
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx",
    ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp",
    ".mp4", ".mp3", ".wav", ".m4a",
    ".xlsx", ".xls",
}

from fastapi import File, Form, HTTPException, Query, UploadFile, Depends
idempotent_keys={}
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
    return await get_all_uploads(guild_id)


async def handle_get_sub_urls(
    url: str = Query(...),
    user: dict = Depends(verify_access_token),
) -> dict:
    url = url.strip()
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    result = await get_sub_urls(url)
    if result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


async def handle_upload_website(
    guild_id: str = Form(...),
    url: str = Form(...),
    idempotent_key: Optional[str] = Form(None),
    user: dict = Depends(require_guild_admin),
) -> dict:
    if idempotent_key:
        with lock:
            if idempotent_key in idempotent_keys:
                return {"status": "success", "message": "Duplicate request ignored"}
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    server_plan = await get_server_plan(str(guild_id))
    plan = server_plan.get("plan", "free")
    counts = await get_uploads_count_by_type(guild_id)
    total_url_count = counts.get("url", 0)
    if plan == "starter" and total_url_count >= 10:
        raise HTTPException(status_code=403, detail="Starter plan limit reached: you've used all 10 URL slots. Upgrade to Pro or higher to add more.")
    if plan == "pro" and total_url_count >= 50:
        raise HTTPException(status_code=403, detail="Pro plan limit reached: you've used all 50 URL slots. Contact us if you need more capacity.")
    if plan == "free" and total_url_count >= 5:
        raise HTTPException(status_code=403, detail="Free plan limit reached: you've used all 5 URL slots. Upgrade to Starter or higher to add more.")
    url = url.strip()
    if not re.match(r"https?://", url):
        raise HTTPException(status_code=400, detail="'url' must start with http:// or https://")
    try:
        feed_id = await add_website_graphlit(guild_id, url)
        if not feed_id:
            await log_upload(
                guild_id=guild_id,
                user_id=user["discord_id"],
                username=user["username"],
                kind="url",
                name=url,
                status="failed",
                error="Graphlit ingestion returned no feed_id (see backend logs for the underlying error)",
            )
            raise HTTPException(status_code=502, detail="Failed to create website feed in knowledge base")
        internal_feed_id = await add_feed_id(guild_id, feed_id)
        if idempotent_key:
            with lock:
                idempotent_keys[idempotent_key] = True
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            feed_id=internal_feed_id,
            content_id=None,
            status="ok",
        )
        return {"status": "success", "message": "Website feed created"}
    except HTTPException:
        raise
    except Exception as e:
        await log_upload(
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
    idempotent_key: Optional[str] = Form(None),
    user: dict = Depends(require_guild_admin),
) -> dict:
    if idempotent_key:
        with lock:
            if idempotent_key in idempotent_keys:
                return {"status": "success", "message": "Duplicate request ignored"}
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    url = url.strip()
    server_plan = await get_server_plan(str(guild_id))
    plan = server_plan.get("plan", "free")
    counts = await get_uploads_count_by_type(guild_id)
    total_url_count = counts.get("url", 0)
    if plan == "starter" and total_url_count >= 10:
        raise HTTPException(status_code=403, detail="Starter plan limit reached: you've used all 10 URL slots. Upgrade to Pro or higher to add more.")
    if plan == "pro" and total_url_count >= 50:
        raise HTTPException(status_code=403, detail="Pro plan limit reached: you've used all 50 URL slots. Contact us if you need more capacity.")
    if plan == "free" and total_url_count >= 5:
        raise HTTPException(status_code=403, detail="Free plan limit reached: you've used all 5 URL slots. Upgrade to Starter or higher to add more.")
    try:
        content_id = await add_url_graphlit(guild_id, url)
        if not content_id:
            await log_upload(
                guild_id=guild_id,
                user_id=user["discord_id"],
                username=user["username"],
                kind="url",
                name=url,
                status="failed",
                error="Graphlit ingestion returned no content_id (see backend logs for the underlying error)",
            )
            raise HTTPException(status_code=502, detail="Failed to ingest URL into knowledge base")
        internal_content_id = await add_content_id(guild_id, content_id)
        if idempotent_key:
            with lock:
                idempotent_keys[idempotent_key] = True
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="url",
            name=url,
            content_id=internal_content_id,
            status="ok",
        )
        return {"status": "success", "message": "URL ingested"}
    except HTTPException:
        raise
    except Exception as e:
        await log_upload(
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
    idempotent_key: Optional[str] = Form(None),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")
    server_plan = await get_server_plan(str(guild_id))
    plan = server_plan.get("plan", "free")
    counts = await get_uploads_count_by_type(guild_id)
    total_file_count = counts.get("file", 0)
    if plan == "starter" and total_file_count >= 10:
        raise HTTPException(status_code=403, detail="Starter plan limit reached: you've used all 10 file slots. Upgrade to Pro or higher to add more.")
    if plan == "pro" and total_file_count >= 50:
        raise HTTPException(status_code=403, detail="Pro plan limit reached: you've used all 50 file slots. Contact us if you need more capacity.")
    if plan == "free" and total_file_count >= 3:
        raise HTTPException(status_code=403, detail="Free plan limit reached: you've used all 3 file slots. Upgrade to Starter or higher to add more.")
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
    if ext in {".xlsx", ".xls"}:
        kind = "xlsx"
    elif ext == ".docx":
        kind = "docx"
    elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
        kind = "image"
    elif ext in {".mp4", ".mp3", ".wav", ".m4a"}:
        kind = "video"
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
            content_id = await add_video_graphlit(guild_id, BytesIO(file_bytes), filename=file.filename or f"upload{ext}")

        if not content_id:
            await log_upload(
                guild_id=guild_id,
                user_id=user["discord_id"],
                username=user["username"],
                kind=kind,
                name=file.filename,
                status="failed",
                error="Graphlit ingestion returned no content_id (see backend logs for the underlying error)",
            )
            raise HTTPException(status_code=502, detail=f"Failed to ingest {ext} into knowledge base")
        internal_content_id = await add_content_id(guild_id, content_id)
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind=kind,
            name=file.filename,
            content_id=internal_content_id,
            status="ok",
        )
        return {"status": "success", "message": f"{ext} ingested", "type": ext.lstrip(".")}

    except HTTPException:
        raise
    except Exception as e:
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind=kind,
            name=file.filename,
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_file] {file.filename} failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")


async def handle_upload_faq(
    guild_id: str = Form(...),
    faq_text: str = Form(...),
    idempotent_key: Optional[str] = Form(None),
    user: dict = Depends(require_guild_admin),
) -> dict:
    if idempotent_key:
        with lock:
            if idempotent_key in idempotent_keys:
                return {"status": "success", "message": "Duplicate request ignored"}
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
        internal_content_id = await add_content_id(guild_id, content_id)
        if idempotent_key:
            with lock:
                idempotent_keys[idempotent_key] = True

        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="faq",
            name=faq_text[:80],
            content_id=internal_content_id,
            status="ok",
        )
        return {"status": "success", "message": "FAQ ingested"}
    except HTTPException:
        raise
    except Exception as e:
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="faq",
            name=faq_text[:80],
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_faq] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest FAQ")


async def handle_delete_upload(
    upload_id: str,
    guild_id: str = Query(...),
    user: dict = Depends(require_guild_admin_query),
) -> dict:
    try:
        row = await get_upload_by_id(upload_id, guild_id)
        if not row:
            raise HTTPException(status_code=404, detail="Upload not found")
        internal_feed_id = row.get("feed_id")
        internal_content_id = row.get("content_id")
        if internal_feed_id:
            raw_feed_id = await get_feed_raw_id(internal_feed_id)
            if raw_feed_id:
                success = await delete_feed_graphlit(raw_feed_id)
                if not success:
                    raise HTTPException(status_code=502, detail="Failed to delete feed from Graphlit")
            await remove_feed_id(internal_feed_id)
        elif internal_content_id:
            raw_content_id = await get_content_raw_id(internal_content_id)
            if raw_content_id:
                success = await delete_content_graphlit(raw_content_id)
                if not success:
                    raise HTTPException(status_code=502, detail="Failed to delete content from Graphlit")
            await remove_content_id(internal_content_id)
        deleted = await remove_upload(upload_id, guild_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Upload not found in DB")
        return {"status": "success", "deleted_id": upload_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[handle_delete_upload] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete upload")


async def handle_upload_contacts(
    guild_id: str = Form(...),
    file: UploadFile = File(...),
    idempotent_key: Optional[str] = Form(None),
    user: dict = Depends(require_guild_admin),
) -> dict:
    guild_id = guild_id.strip()
    if not guild_id:
        raise HTTPException(status_code=400, detail="'guild_id' cannot be empty")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".xlsx", ".xls"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: .xlsx, .xls"
        )

    file.file.seek(0, 2)
    if file.file.tell() > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File must be smaller than 10 MB")
    file.file.seek(0)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        from python.contacts.xlsx_contacts import ingest_contacts_to_vectorstore
        res = ingest_contacts_to_vectorstore(BytesIO(file_bytes), guild_id)
        if res["status"] == "error":
            raise Exception(res["error"])
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="contacts",
            name=file.filename,
            content_id=None,
            status="ok",
        )
        return {"status": "success", "message": f"Ingested {res['chunks']} contact record(s) successfully"}
    except Exception as e:
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="contacts",
            name=file.filename,
            status="failed",
            error=str(e),
        )
        print(f"[handle_upload_contacts] {file.filename} failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process contacts: {e}")

async def handle_upload_channel_messages(guild_id: str = Form(...), channel_id: str = Form(...), time: int = Form(...), user: dict = Depends(require_guild_admin)):
    try:
        server_id_int = int(guild_id)
        channel_id_int = int(channel_id)
        messages = await get_message_from_channel(server_id_int, channel_id_int, time)
        for m in messages:
            content_id = await add_text_graphlit(guild_id, m)
            internal_content_id = await add_content_id(guild_id, content_id) if content_id else None
            await log_upload(
                guild_id=guild_id,
                user_id=user["discord_id"],
                username=user["username"],
                kind="text",
                name=m[:80],
                content_id=internal_content_id,
                status="ok",
            )
        return {"status": "success", "message": "Messages ingested"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Messages From Channel: {e}")


async def handle_get_my_uploads(
    user: dict = Depends(verify_access_token),
) -> list:
    try:
        async with AsyncDB() as s:
            rows = (
                await s.execute(
                    text("""
                        SELECT u.*, s.server_name 
                        FROM uploads u 
                        JOIN servers s ON u.server_id = s.server_id 
                        WHERE u.uploaded_by = :uid 
                        ORDER BY u.uploaded_at DESC
                    """),
                    {"uid": user["discord_id"]},
                )
            ).mappings().all()
            result = []
            for r in rows:
                row_dict = dict(r)
                if row_dict.get("uploaded_at"):
                    row_dict["uploaded_at"] = row_dict["uploaded_at"].isoformat()
                if row_dict.get("deleted_at"):
                    row_dict["deleted_at"] = row_dict["deleted_at"].isoformat()
                if row_dict.get("id"):
                    row_dict["id"] = str(row_dict["id"])
                result.append(row_dict)
            return result
    except Exception as e:
        print(f"[handle_get_my_uploads] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user uploads")


async def handle_add_github_repo(repo_url: str = Form(...), guild_id: str = Form(...), personal_access_token: str = Form(default=None), user: dict = Depends(require_guild_admin)) -> dict:
    try:
        total_number_of_feeds = await get_github_ingested_count(guild_id)
        if total_number_of_feeds >= 1:
            raise HTTPException(status_code=403, detail="You can only add one GitHub repository per server. Please delete the existing one before adding a new one.")
        repo_url = repo_url.strip()
        if not re.match(r"https?://", repo_url):
            raise HTTPException(status_code=400, detail="'repo_url' must start with http:// or https://")
        feed_id = await add_github_repo_graphlit(guild_id, repo_url, personal_access_token)
        if not feed_id:
            await log_upload(
                guild_id=guild_id,
                user_id=user["discord_id"],
                username=user["username"],
                kind="github",
                name=repo_url,
                status="failed",
                error="Failed to create GitHub crawl feed in Graphlit",
            )
            raise HTTPException(status_code=502, detail="Failed to ingest GitHub repository into knowledge base")
        internal_feed_id = await add_feed_id(guild_id, feed_id)
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="github",
            name=repo_url,
            feed_id=internal_feed_id,
            content_id=None,
            status="ok",
        )
        return {"status": "success", "message": "GitHub repository ingested"}
    except HTTPException:
        raise
    except Exception as e:
        await log_upload(
            guild_id=guild_id,
            user_id=user["discord_id"],
            username=user["username"],
            kind="github",
            name=repo_url,
            status="failed",
            error=str(e),
        )
        print(f"[upload_github_rep] Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to ingest GitHub repository")