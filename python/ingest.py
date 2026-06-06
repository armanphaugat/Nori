import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from io import BytesIO
import docx2txt
from PIL import Image
import pytesseract
import whisper
import asyncio
import tempfile
from graphlit import Graphlit
from dbhelper.db_helper import *
import base64
import pandas as pd
from dotenv import load_dotenv
from graphlit_api import FeedTypes, WebFeedPropertiesInput,FeedInput
load_dotenv()
env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_ID") or os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")
graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)

whisper_model = whisper.load_model("base")
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

def read_video(file):
    tmp_path = None
    try:
        if isinstance(file, str):
            if not os.path.exists(file):
                raise ValueError(f"File not found: {file}")
            tmp_path = file
        elif isinstance(file, BytesIO):
            file.seek(0)
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(file.read())
                tmp_path = tmp.name
        else:
            raise ValueError("file must be a file path or BytesIO object")
        result = whisper_model.transcribe(tmp_path)
        text = result["text"]
        if not text or not text.strip():
            raise ValueError("No text transcribed -> video may have no audio")
        return text.lower()
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to transcribe video: {e}")
    finally:
        if tmp_path and isinstance(file, BytesIO) and os.path.exists(tmp_path):
            os.remove(tmp_path)

async def add_url_graphlit(server_id: str, url: str):
    try:
        response = await graphlit.client.ingest_uri(url, is_synchronous=True)
        add_content_id(server_id, response.ingest_uri.id)
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
        add_content_id(server_id, response.ingest_encoded_file.id)
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
        add_content_id(server_id, str(response.ingest_text.id))
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
                schedulePolicy={
                    "recurrenceType": "REPEAT",
                    "repeatInterval": "P1D"
                }
            )
        )
        feed_id = response.create_feed.id
        print(f"[DEBUG] Feed created: {feed_id} for server: {server_id}")
        add_feed_id(server_id, str(feed_id))
        return feed_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")

async def add_word_graphlit(server_id: str, file):
    try:
        text = read_word(file)
        response = await graphlit.client.ingest_text(text=text, is_synchronous=True)
        add_content_id(server_id, str(response.ingest_text.id))
        return response.ingest_text.id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_image_graphlit(server_id: str, file):
    try:
        text = read_ocr(file)
        response = await graphlit.client.ingest_text(text=text, is_synchronous=True)
        add_content_id(server_id, str(response.ingest_text.id))
        return response.ingest_text.id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0

async def add_video_graphlit(server_id: str, file):
    try:
        text = read_video(file)
        response = await graphlit.client.ingest_text(text=text, is_synchronous=True)
        add_content_id(server_id, str(response.ingest_text.id))
        return response.ingest_text.id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0
    