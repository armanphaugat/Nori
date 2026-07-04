import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from io import BytesIO
from dotenv import load_dotenv
from ragie import Ragie

load_dotenv()
RAGIE_API_KEY = os.getenv("RAGIE_API_KEY")

r_client = Ragie(auth=RAGIE_API_KEY)


async def add_url_graphlit(server_id: str, url: str):
    try:
        res = await r_client.documents.create_async(request={
            "url": url,
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "url"},
        })
        content_id = res.id
        print(f"[{server_id}] URL ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed to ingest {url}: {e}")
        return 0


async def add_pdf_graphlit(server_id: str, pdf):
    try:
        if isinstance(pdf, BytesIO):
            pdf.seek(0)
            pdf = pdf.read()
        res = await r_client.documents.create_async(request={
            "file": {"file_name": f"{uuid.uuid4().hex}.pdf", "content": pdf},
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "pdf"},
        })
        content_id = res.id
        print(f"[{server_id}] PDF ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0


async def add_text_graphlit(server_id: str, faq_text: str):
    try:
        res = await r_client.documents.create_raw_async(request={
            "data": faq_text,
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "text"},
        })
        content_id = res.id
        print(f"[{server_id}] Text ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0


async def add_word_graphlit(server_id: str, file):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file = file.read()
        res = await r_client.documents.create_async(request={
            "file": {"file_name": f"{uuid.uuid4().hex}.docx", "content": file},
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "docx"},
        })
        content_id = res.id
        print(f"[{server_id}] Word doc ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0


async def add_image_graphlit(server_id: str, file, ext: str = "jpg"):
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file = file.read()
        elif isinstance(file, str):
            ext = file.split(".")[-1].lower()
            with open(file, "rb") as f:
                file = f.read()
        res = await r_client.documents.create_async(request={
            "file": {"file_name": f"{uuid.uuid4().hex}.{ext}", "content": file},
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "image"},
        })
        content_id = res.id
        print(f"[{server_id}] Image ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return 0


async def add_video_graphlit(server_id: str, file, filename: str = "upload"):
    """Native audio/video support per Ragie's pipeline — same create call, just pass the media file."""
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
            file = file.read()
        res = await r_client.documents.create_async(request={
            "file": {"file_name": f"{uuid.uuid4().hex}.{filename.split('.')[-1]}", "content": file},
            "partition": server_id,
            "metadata": {"server_id": server_id, "source": "video"},
        })
        content_id = res.id
        print(f"[{server_id}] Audio/video ingested -> {content_id}")
        return content_id
    except Exception as e:
        print(f"[{server_id}] Failed to ingest {filename}: {e}")
        return 0


async def add_github_repo_graphlit(server_id: str, repo_url: str, personal_access_token: str | None = None):
    """No native GitHub connector — clone locally, upload each file, return list of ids."""
    import subprocess, tempfile, glob
    try:
        tmp_dir = tempfile.mkdtemp()
        clone_url = repo_url
        if personal_access_token:
            clone_url = repo_url.replace("https://", f"https://{personal_access_token}@")
        subprocess.run(["git", "clone", "--depth", "1", clone_url, tmp_dir], check=True)

        ids = []
        for path in glob.glob(f"{tmp_dir}/**/*.md", recursive=True) + glob.glob(f"{tmp_dir}/**/*.py", recursive=True):
            with open(path, "rb") as f:
                content = f.read()
            res = await r_client.documents.create_async(request={
                "file": {"file_name": f"{uuid.uuid4().hex}.{os.path.basename(path).split('.')[-1]}", "content": content},
                "partition": server_id,
                "metadata": {"server_id": server_id, "source": "github", "repo": repo_url},
            })
            ids.append(res.id)
        print(f"[{server_id}] GitHub repo ingested -> {len(ids)} files")
        return ids  # list, not single id — see note below
    except Exception as e:
        print(f"[{server_id}] Failed: {e}")
        return []


async def add_website_graphlit(server_id: str, url: str):
    """No native recurring feed — reuse add_url_graphlit, run it on your own cron."""
    return await add_url_graphlit(server_id, url)