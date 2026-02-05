from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stocks, news, analysis, portfolio, reviews
from worker import start_scheduler
from contextlib import asynccontextmanager
from news_service import load_ai_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background scheduler on startup
    print("🚀 Starting AI Background Worker...")
    load_ai_model() # Load BERT model once
    start_scheduler()
    yield
    print("🛑 Shutting down...")

app = FastAPI(title="IndoStockSentiment API", version="1.0.0", lifespan=lifespan)

# Enable CORS for Next.js frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
