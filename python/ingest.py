import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from io import BytesIO
import docx2txt
from PIL import Image
import asyncio
from graphlit import Graphlit
from dbhelper.db_helper import *
import base64
from dotenv import load_dotenv
from graphlit_api import *
load_dotenv()
env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_ID") or os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")
graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)

def read_word(file):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            text = docx2txt.process(file)
        elif isinstance(file, str):
            text = docx2txt.process(file)
        else:
            raise ValueError("file must be a file path or BytesIO object")
        if not text or not text.strip():
            raise ValueError("No text extracted from Word document")
        return text.lower()
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read Word file: {e}")

def read_ocr(file):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            image = Image.open(file)
        elif isinstance(file, str):
            image = Image.open(file)
        else:
            raise ValueError("file must be a file path or BytesIO object")
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
        if not text or not text.strip():
            raise ValueError("No text extracted — image may be blank or unreadable")
        return text.lower()
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read image via OCR: {e}")
    
async def read_ocr_async(file):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, read_ocr, file)

async def add_url_graphlit(server_id: str, url: str):
    try:
        response = await graphlit.client.ingest_uri(url, is_synchronous=True)
        await add_content_id(server_id, response.ingest_uri.id)
        print("Url Addded")
        return response.ingest_uri.id
    except Exception as e:
        print(f"[{server_id}] Failed to ingest {url}: {e}")

async def add_pdf_graphlit(server_id: str, pdf):
    try:
        if isinstance(pdf, BytesIO):
            pdf.seek(0)
            pdf = pdf.read()
        base64_data = base64.b64encode(pdf).decode("utf-8")
        response = await graphlit.client.ingest_encoded_file(
            name=f"{server_id}_upload.pdf",
            data=base64_data,
            mime_type="application/pdf",
            is_synchronous=True
        )
        if not response:
            print("No ingestion Done")
            return 0
        await add_content_id(server_id, response.ingest_encoded_file.id)
        return response.ingest_encoded_file.id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_text_graphlit(server_id: str, faq_text: str):
    try:
        response = await graphlit.client.ingest_text(text=faq_text, is_synchronous=True)
        if not response:
            print("Not Able To Add Text To Graphlit")
            return 0
        await add_content_id(server_id, str(response.ingest_text.id))
        return response.ingest_text.id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_website_graphlit(server_id: str, url: str):
    try:
        response = await graphlit.client.create_feed(
            feed=FeedInput(
                name=f"{server_id}_feed",
                type=FeedTypes.WEB,
                web=WebFeedPropertiesInput(uri=url),
                schedule_policy=FeedSchedulePolicyInput(
                    recurrence_type=TimedPolicyRecurrenceTypes.REPEAT,
                    repeat_interval="P1D"
                )
            )
        )
        feed_id = response.create_feed.id
        print(f"[DEBUG] Feed created: {feed_id} for server: {server_id}")
        await add_feed_id(server_id, str(feed_id))
        return feed_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")

async def add_word_graphlit(server_id: str, file):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file = file.read()
        base64_data = base64.b64encode(file).decode("utf-8")
        response = await graphlit.client.ingest_encoded_file(
            name=f"{server_id}_upload.docx",
            data=base64_data,
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            is_synchronous=True
        )
        if not response:
            print("No ingestion Done")
            return 0
        await add_content_id(server_id, str(response.ingest_encoded_file.id))
        return response.ingest_encoded_file.id

    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_image_graphlit(server_id: str, file,ext:str="jpg"):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file = file.read()
        elif isinstance(file, str):
            ext = file.split(".")[-1].lower()
            with open(file, "rb") as f:
                file = f.read()
        file_data = base64.b64encode(file).decode("utf-8")
        mime_types = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
            "tiff": "image/tiff",
            "bmp": "image/bmp",
        }
        mime_type = mime_types.get(ext.lower(), "image/jpeg")
        response = await graphlit.client.ingest_encoded_file(
            name=f"{server_id}_upload.{ext}",
            data=file_data,
            mime_type=mime_type,
            is_synchronous=True
        )
        if not response:
            print("No ingestion Done")
            return 0
        content_id = response.ingest_encoded_file.id
        await add_content_id(server_id, str(content_id))
        print(f"[{server_id}] Image ingested → {content_id}")
        return content_id

    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_video_graphlit(server_id: str, file, filename: str = "upload"):
    """
    Ingest an audio/video file into Graphlit using their native cloud transcription.
    Supports: .mp4, .mp3, .wav, .m4a
    No local CPU processing — file is base64-encoded and sent to Graphlit's API.
    """
    MIME_TYPES = {
        "mp4": "video/mp4",
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "m4a": "audio/mp4",
    }
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file_bytes = file.read()
        elif isinstance(file, (str, os.PathLike)):
            with open(file, "rb") as f:
                file_bytes = f.read()
        else:
            raise ValueError("file must be a file path or BytesIO object")

        ext = os.path.splitext(filename)[1].lstrip(".").lower() or "mp4"
        mime_type = MIME_TYPES.get(ext, "video/mp4")

        base64_data = base64.b64encode(file_bytes).decode("utf-8")
        response = await graphlit.client.ingest_encoded_file(
            name=f"{server_id}_{filename}",
            data=base64_data,
            mime_type=mime_type,
            is_synchronous=True,
        )
        if not response:
            print(f"[{server_id}] Graphlit returned no response for {filename}")
            return 0
        content_id = response.ingest_encoded_file.id
        await add_content_id(server_id, str(content_id))
        print(f"[{server_id}] Audio/video ingested → {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed to ingest {filename}: {e}")
        return 0

async def add_github_repo_graphlit(server_id: str, repo_url: str, personal_access_token: str | None = None):
    try:
        parts = repo_url.rstrip("/").split("/")
        repo_name = parts[-1]
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
        repo_owner = parts[-2]
        # Clean and normalize token (handle empty string, whitespace, and 'null'/'undefined' string values)
        token_str = (personal_access_token or "").strip()
        if token_str.lower() in {"", "null", "undefined"}:
            token_str = ""
        env_token = (os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN") or "").strip()
        
        token = token_str or env_token or None
        
        github_kwargs = {
            "repository_owner": repo_owner,
            "repository_name": repo_name,
        }
        if token:
            github_kwargs["authentication_type"] = GitHubAuthenticationTypes.PERSONAL_ACCESS_TOKEN
            github_kwargs["personal_access_token"] = token
            
        response = await graphlit.client.create_feed(
            feed=FeedInput(
                name=f"f{repo_name}-{server_id}",
                type=FeedTypes.SITE,
                site=SiteFeedPropertiesInput(
                    type=FeedServiceTypes.GIT_HUB,
                    is_recursive=True,
                    github=GitHubFeedPropertiesInput(**github_kwargs),
                ),
            )
        )
        result = response.create_feed
        feed_id = result.id
        await add_feed_id(server_id, feed_id)
        return feed_id

    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0