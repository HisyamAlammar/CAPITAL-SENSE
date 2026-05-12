import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from database import init_db
from news_service import load_ai_model
from routers import analysis, news, portfolio, reviews, stocks
from worker import start_scheduler


RATE_WINDOW_SECONDS = 60
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
_rate_limit_hits = defaultdict(deque)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting AI Background Worker...")
    init_db()
    load_ai_model()
    scheduler = start_scheduler()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        print("Shutting down...")


app = FastAPI(title="IndoStockSentiment API", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    hits = _rate_limit_hits[client_ip]

    while hits and now - hits[0] > RATE_WINDOW_SECONDS:
        hits.popleft()

    if len(hits) >= RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded."},
        )

    hits.append(now)
    return await call_next(request)


allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Token"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to IndoStockSentiment API", "status": "active"}


app.include_router(stocks.router)
app.include_router(news.router)
app.include_router(analysis.router)
app.include_router(portfolio.router)
app.include_router(reviews.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
