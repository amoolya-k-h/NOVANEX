from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.routes import scan, findings, ai, reports, verify
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize DB tables immediately on load
try:
    init_db()
    logger.info("RepoGuard AI database initialized ✓")
except Exception as e:
    logger.error(f"DB initialization warning: {e}")

app = FastAPI(
    title="RepoGuard AI",
    description="AI-Powered Developer Security Scanner",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(findings.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(verify.router)


@app.on_event("startup")
async def startup():
    init_db()
    logger.info("RepoGuard AI backend started ✓")


@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "service": "RepoGuard AI"}
