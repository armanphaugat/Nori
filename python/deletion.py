import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from io import BytesIO
import docx2txt
from PIL import Image
import pytesseract
import whisper
import tempfile
from graphlit import Graphlit
from dbhelper.db_helper import *
import base64
import pandas as pd
from graphlit_api import FeedTypes, WebFeedPropertiesInput, FeedSchedulePolicyInput, TimedPolicyRecurrenceTypes,FeedInput
load_dotenv()
env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")
graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)
async def delete_content_graphlit(content_id: str) -> bool:
    try:
        response = await graphlit.client.delete_content(id=content_id)
        if not response:
            print(f"[delete_content_graphlit] No response for content_id: {content_id}")
            return False
        print(f"[delete_content_graphlit] Deleted content: {content_id}")
        return True
    except Exception as e:
        print(f"[delete_content_graphlit] Failed to delete content {content_id}: {e}")
        return False


async def delete_feed_graphlit(feed_id: str) -> bool:
    try:
        response = await graphlit.client.delete_feed(id=feed_id)
        if not response:
            print(f"[delete_feed_graphlit] No response for feed_id: {feed_id}")
            return False
        print(f"[delete_feed_graphlit] Deleted feed: {feed_id}")
        return True
    except Exception as e:
        print(f"[delete_feed_graphlit] Failed to delete feed {feed_id}: {e}")
        return False