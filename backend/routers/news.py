import asyncio

from fastapi import APIRouter, HTTPException, Query

from database import NewsArticle, SessionLocal
from news_service import fetch_google_news, save_articles_to_db


router = APIRouter(prefix="/api/news", tags=["news"])


def _query_market_news_sync(q: str):
    db = SessionLocal()
    try:
        query = db.query(NewsArticle).order_by(NewsArticle.published_at.desc())

        if q and q != "Global":
            search_filter = f"%{q}%"
            query = query.filter(
                (NewsArticle.related_stock == q) |
                (NewsArticle.title.like(search_filter))
            )

        results = query.limit(100).all()
        return [
            {
                "title": item.title,
                "description": item.description,
                "summary": item.summary,
                "source": item.source,
                "link": item.link,
                "published_at": item.published_at.strftime("%Y-%m-%d %H:%M:%S"),
                "sentiment_label": item.sentiment_label,
                "sentiment_score": item.sentiment_score,
                "event_type": item.event_type,
                "market_impact": item.market_impact,
                "ai_rationale": item.ai_rationale,
            }
            for item in results
        ]
    finally:
        db.close()


def _save_live_news_sync(articles: list, related_stock: str):
    db = SessionLocal()
    try:
        save_articles_to_db(db, articles, related_stock=related_stock)
    finally:
        db.close()


@router.get("/")
async def get_market_news(
    q: str = Query("Global", min_length=1, max_length=32, pattern=r"^[A-Za-z0-9 ._-]+$"),
):
    try:
        q = q.strip()
        results = await asyncio.to_thread(_query_market_news_sync, q)

        allow_live_fetch = q != "Global" and len(q) <= 8 and " " not in q
        if len(results) < 5 and allow_live_fetch:
            live_articles = await asyncio.wait_for(
                fetch_google_news(f"{q} saham", limit=10),
                timeout=4,
            )
            if live_articles:
                await asyncio.to_thread(_save_live_news_sync, live_articles, q)
                results = await asyncio.to_thread(_query_market_news_sync, q)

        return results
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Google News timed out.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in news API: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market news.")
