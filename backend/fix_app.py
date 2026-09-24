code = '''from __future__ import annotations
import os, uuid
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pypdf
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from google import genai
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path("./data")
QDRANT_PATH = DATA_DIR / "qdrant"
QDRANT_PATH.mkdir(parents=True, exist_ok=True)
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "portfolio_rag")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
EMBEDDING_DIM = 768

qdrant: QdrantClient | None = None
gemini_client: genai.Client | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global qdrant, gemini_client
    qdrant = QdrantClient(path=str(QDRANT_PATH))
    if not qdrant.collection_exists(COLLECTION_NAME):
        qdrant.create_collection(collection_name=COLLECTION_NAME, vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE))
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        gemini_client = genai.Client(api_key=api_key)
    yield

app = FastAPI(lifespan=lifespan)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class QueryRequest(BaseModel):
    query: str
    document_id: str | None = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]

class TalkRequest(BaseModel):
    message: str

def extract_text(file_path: Path) -> str:
    text = ""
    with open(file_path, "rb") as f:
        for page in pypdf.PdfReader(f).pages:
            text += page.extract_text() + "\\n"
    return text

def chunk_text(text: str, size=500, overlap=50) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start+size])
        start += size - overlap
    return [c for c in chunks if c.strip()]

def embed(texts: list[str], is_query=False) -> list[list[float]]:
    if not gemini_client: raise RuntimeError("No API Key")
    return [gemini_client.models.embed_content(model=EMBEDDING_MODEL, content=t, task_type="RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT").embeddings[0].values for t in texts]

@app.get("/health")
def health():
    return {"status": "ok", "model": GEMINI_MODEL, "gemini": gemini_client is not None}

@app.get("/documents")
def docs():
    pdf_dir = DATA_DIR / "pdfs"
    if not pdf_dir.exists(): return []
    return [{"id": p.stem, "name": p.name} for p in pdf_dir.glob("*.pdf")]

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"): raise HTTPException(400, "PDF only")
    pdf_dir = DATA_DIR / "pdfs"; pdf_dir.mkdir(exist_ok=True)
    doc_id = str(uuid.uuid4())[:8]
    path = pdf_dir / f"{doc_id}.pdf"
    with open(path, "wb") as f: f.write(await file.read())
    text = extract_text(path)
    chunks = chunk_text(text)
    if not chunks: raise HTTPException(400, "No text found")
    embeddings = embed(chunks)
    points = [PointStruct(id=str(uuid.uuid4()), vector=emb, payload={"doc_id": doc_id, "text": txt}) for txt, emb in zip(chunks, embeddings)]
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
    return {"id": doc_id, "name": file.filename, "chunks": len(chunks)}

@app.post("/query", response_model=ChatResponse)
def query(req: QueryRequest):
    q_emb = embed([req.query], is_query=True)[0]
    filt = {"must": [{"key": "doc_id", "match": {"value": req.document_id}}]} if req.document_id else None
    hits = qdrant.search(collection_name=COLLECTION_NAME, query_vector=q_emb, limit=3, query_filter=filt)
    if not hits: return ChatResponse(answer="No info found.", sources=[])
    ctx = "\\n\\n".join(h.payload["text"] for h in hits)
    prompt = f"Context:\\n{ctx}\\n\\nQuestion: {req.query}\\nAnswer:"
    try:
        ans = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt).text
    except Exception as e:
        ans = f"Error: {e}"
    return ChatResponse(answer=ans, sources=[{"doc": h.payload["doc_id"], "score": h.score} for h in hits])

@app.post("/talk")
def talk(req: TalkRequest):
    if not gemini_client:
        return {"reply": "I'm currently offline. Please reach out via email."}
    prompt = f"""You are ME, the AI twin of Aurangzeb Imran. 
    You speak strictly in the first person ('I', 'my', 'me'). 
    You are an AI Relief Engineer who builds practical AI, RAG systems, and intelligent web apps. 
    Keep replies concise, confident, and conversational. Never say 'As an AI language model'. 
    If they ask about RAG, tell them to upload a PDF in the RAG section to test it live.
    User: {req.message}
    ME:"""
    try:
        resp = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        return {"reply": resp.text}
    except Exception as e:
        return {"reply": f"I'm having a little trouble thinking right now ({e}). Please email Aurangzeb directly!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
with open("app.py", "w") as f:
    f.write(code)
print("✅ app.py fully rewritten with /talk endpoint.")
