import os
import re
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_huggingface import HuggingFaceEmbeddings
from bs4 import SoupStrainer, BeautifulSoup
import PyPDF2
import pdfplumber
from io import BytesIO
import docx2txt
from PIL import Image
import pytesseract
from playwright.sync_api import sync_playwright
import whisper
import tempfile
import os
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

TAGS = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "span", "strong", "b", "em",
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "thead", "tbody", "tr", "th", "td", "caption",
    "div", "section", "article", "aside", "main",
    "header", "footer", "nav", "figure", "figcaption",
    "label", "legend", "a", "details", "summary",
    "address", "time", "blockquote"
]

def webscraper(url):
    try:
        loader = WebBaseLoader(
            url,
            bs_kwargs={"parse_only": SoupStrainer(TAGS)}
        )
        docs = loader.load()
        cleaned = []
        for doc in docs:
            if not isinstance(doc.page_content, str):
                continue
            lines = doc.page_content.splitlines()
            lines = [line.strip() for line in lines if line.strip()]
            lines = list(dict.fromkeys(lines))
            content = "\n".join(lines).lower()
            if len(content.strip()) > 100:
                cleaned.append(content)
        total_content = " ".join(cleaned)
        if len(total_content.strip()) >= 100:
            print(f"WebBaseLoader succeeded for {url}")
            return cleaned
    except Exception as e:
        print(f"WebBaseLoader failed for {url}: {e} -> trying Playwright")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page.goto(url, wait_until="networkidle", timeout=15000)
            html = page.content()
            browser.close()

        soup = BeautifulSoup(html, "html.parser", parse_only=SoupStrainer(TAGS))
        lines = soup.get_text(separator="\n").splitlines()
        lines = [line.strip() for line in lines if line.strip()]
        lines = list(dict.fromkeys(lines))
        content = "\n".join(lines).lower()

        if len(content.strip()) < 100:
            print(f"Playwright also returned too little content for {url}")
            return []

        print(f"Playwright succeeded for {url}")
        return [content]

    except Exception as e:
        print(f"Playwright fallback failed for {url}: {e}")
        return []

def read_pdf(file):
    text = ""
    if isinstance(file, BytesIO):
        file.seek(0)
    elif isinstance(file, str):
        file = open(file, "rb")
    else:
        raise ValueError("file must be a file path or BytesIO object")
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
        with pdfplumber.open(file) as pdf:
            if len(pdf.pages) == 0:
                raise ValueError("PDF has no pages")
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text.lower() + "\n"
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        row_text = " | ".join(
                            str(cell).strip() for cell in row if cell
                        )
                        if row_text.strip():
                            text += row_text.lower() + "\n"
        if text.strip():
            return text
    except Exception as e:
        print(f"⚠️ pdfplumber failed: {e} — trying PyPDF2")
    try:
        if isinstance(file, BytesIO):
            file.seek(0)
        reader = PyPDF2.PdfReader(file)
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except:
                raise ValueError("PDF is password protected")
        for page in reader.pages:
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text.lower() + "\n"
            except Exception as e:
                print(f"⚠️ Skipping page: {e}")
                continue
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to read PDF: {e}")

    if not text.strip():
        raise ValueError("No text extracted — PDF might be a scanned image")

    return text

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

def read_video(file):
    model = whisper.load_model("base")
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
            raise ValueError("file must be a file path, or BytesIO object")
        print(f"Transcribing {tmp_path}")
        result = model.transcribe(tmp_path)
        text = result["text"]
        if not text or not text.strip():
            raise ValueError("No text transcribed -> video may have no audio")
        return text.lower()
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to transcribe video: {e}")
    finally:
        if tmp_path and tmp_path != file and os.path.exists(tmp_path):
            os.remove(tmp_path)

def split_texts(texts, chunk_size=500, chunk_overlap=100):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    chunks = []
    for text in texts:
        if isinstance(text, tuple):
            text = text[0]
        if isinstance(text, list):
            text = " ".join(str(t) for t in text)
        if not isinstance(text, str):
            text = str(text)
        text = text.strip()
        if text:
            chunks.extend(splitter.split_text(text))
    return chunks

def create_vectorstore(chunks, server_id):
    server_id_str = str(server_id)
    DB_DIR = f"vectorstore/{server_id_str}/faiss_index"
    os.makedirs(DB_DIR, exist_ok=True)
    seen = set()
    unique_texts = []
    for t in chunks:
        if isinstance(t, tuple):
            t = t[0]
        if not isinstance(t, str):
            t = str(t)
        cleaned = t.strip()
        if cleaned and cleaned not in seen and len(cleaned) > 30:
            seen.add(cleaned)
            unique_texts.append(cleaned)
    print(f"Deduplicated: {len(chunks)} → {len(unique_texts)} chunks")

    if not unique_texts:
        print("No valid texts to store")
        return False

    try:
        if os.path.exists(os.path.join(DB_DIR, "index.faiss")):
            print(f"Appending to existing vectorstore for {server_id_str}")
            vectorstore = FAISS.load_local(
                DB_DIR,
                embeddings,
                allow_dangerous_deserialization=True
            )
            vectorstore.add_texts(unique_texts)
        else:
            print(f"Creating new vectorstore for {server_id_str}")
            vectorstore = FAISS.from_texts(unique_texts, embeddings)

        vectorstore.save_local(DB_DIR)
        print(f"Vectorstore saved to {DB_DIR}")
        return True

    except Exception as e:
        import traceback
        print(f"Vectorstore error: {e}")
        print(traceback.format_exc())
        return False

def append_text_to_vectorstore(server_id, text):
    if not text or not text.strip():
        print("Empty text, nothing to store")
        return False
    return create_vectorstore([text], server_id)

def load_vectorstore(server_id):
    server_id_str = str(server_id)
    DB_DIR = f"vectorstore/{server_id_str}/faiss_index"
    if not os.path.exists(os.path.join(DB_DIR, "index.faiss")):
        print(f"Vectorstore not found at {DB_DIR}")
        return None
    return FAISS.load_local(
        DB_DIR,
        embeddings,
        allow_dangerous_deserialization=True
    )