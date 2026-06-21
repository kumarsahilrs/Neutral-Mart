from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time

from app.routers import listing, marketing, agent, pricing, seller as seller_router, search as search_router, graphic as graphic_router, credits as credits_router, tts as tts_router, enhance as enhance_router
from app.services.ai_logger import log_ai_error

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nirmalmandi.ai")

app = FastAPI(
    title="NirmalMandi AI Service",
    version="1.0.0",
    docs_url="/docs" if __import__("os").getenv("NODE_ENV") != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tightened at API Gateway level
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} [{duration_ms}ms]")
    return response

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service"}

app.include_router(listing.router, prefix="/ai/listing", tags=["Listing AI"])
app.include_router(marketing.router, prefix="/ai/content", tags=["Marketing AI"])
app.include_router(agent.router, prefix="/ai/agent", tags=["AI Agent"])
app.include_router(pricing.router, prefix="/ai/pricing", tags=["Pricing AI"])
app.include_router(seller_router.router, prefix="/ai/seller", tags=["Seller AI"])
app.include_router(search_router.router, prefix="/search", tags=["Search AI"])
app.include_router(graphic_router.router, prefix="/ai/marketing", tags=["Graphic AI"])
app.include_router(credits_router.router, prefix="/ai/credits", tags=["AI Credits"])
app.include_router(tts_router.router, prefix="/ai/agent", tags=["TTS"])
app.include_router(enhance_router.router, prefix="/ai/marketing", tags=["Image Enhancement"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"success": False, "error": "AI service error"})
