from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.config import settings
from app.scoring.embeddings import get_embedding_model

app = FastAPI(
    title="AI Powered Recruiter Assistant API",
    description="Automated Resume Screening System with NLP, Sentence-Transformers, Bias Mitigation, and GPT Explainability",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_warmup():
    """Pre-warm the SentenceTransformer embedding model on server boot so evaluations are instant."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, get_embedding_model)
    except Exception as e:
        print(f"Startup warmup note: {e}")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server & production client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(api_router, prefix="/api")
# Also alias direct root routes as per prompt specs (/upload-resumes, /parse-jd, etc.)
app.include_router(api_router, prefix="")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "AI Powered Recruiter Assistant Backend API",
        "docs": "/docs",
        "openai_key_configured": bool(settings.OPENAI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
