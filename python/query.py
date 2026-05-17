from dotenv import load_dotenv
load_dotenv(override=True)
from graphlit import Graphlit
from dbhelper.db_helper import *
graphlit=Graphlit()

async def query_graphlit(server_id:str,question:str):
    try:
        content_ids=await get_content_ids(server_id)
        feed_ids=await get_feed_ids(server_id)
        if not content_ids and not feed_ids:
            return "No knowledge base found for this server."
        content_filter=None
        if content_ids:
            content_filter={
                "contents":[{"id":cid} for cid in content_ids]
            }
        feed_filter=None
        if feed_ids:
            feed_filter = {
                "feeds": [{"id": fid} for fid in feed_ids]
            }
        conversation=await graphlit.client.create_conversation(
            name=f"{server_id}_query",filter={
                **(content_filter or {}),
                **(feed_filter or {})
            }
        )
        conversation_id=conversation.create_conversation.id
        response=await graphlit.client.prompt_conversation(
            prompt=question,
            id=conversation_id
        )
        answer = response.prompt_conversation.message.message
        return answer
    except Exception as e:
        print(f"[{server_id}] Query failed: {e}")