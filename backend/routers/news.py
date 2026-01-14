from fastapi import APIRouter
from database import SessionLocal, NewsArticle
from news_service import fetch_google_news, save_articles_to_db

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/")
async def get_market_news(q: str = "Global"):
    """
    Fetch news from Local Database (Instant Response).
    Query 'q' can be 'Global' or a stock symbol like 'BBCA'.
    FALLBACK: If DB is empty for a specific stock, fetch live from Google News.
    """
    db = SessionLocal()
    try:
        # Default sort: Newest first
        query = db.query(NewsArticle).order_by(NewsArticle.published_at.desc())
        
        if q and q != "Global":
            # If searching for specific stock
            search_filter = f"%{q}%"
            query = query.filter(
                (NewsArticle.related_stock == q) | 
                (NewsArticle.title.like(search_filter))
            )
        else:
            # If q is Global or empty, show Global news + any high profile news
            pass

        # Increase DB limit to 100
        results = query.limit(100).all()
        
        # --- CACHE MISS / LOW DATA FALLBACK ---
        # If results are too few (< 5) for a specific stock search, fetch live!
        if len(results) < 5 and q != "Global":
            print(f"⚠️ Low Data ({len(results)}) for '{q}'. Fetching Live...")
            
            # Construct a better query for Google News
            live_query = f"{q} saham"
            
            # Fetch & Analyze (Increase limit to 30)
            live_articles = fetch_google_news(live_query, limit=30)
            
            if live_articles:
                # Save to DB (Handle duplicates internally)
                save_articles_to_db(db, live_articles, related_stock=q)
                
                # RE-QUERY to get everything sorted and unified
                # (This ensures we return the full set including what we just saved)
                results = query.limit(100).all()
        
        return [{
            "title": item.title,
            "description": item.description,
            "source": item.source,
            "link": item.link,
            "published_at": item.published_at.strftime("%Y-%m-%d %H:%M:%S"),
            "sentiment_label": item.sentiment_label,
            "sentiment_score": item.sentiment_score
        } for item in results]
        
    except Exception as e:
        print(f"Error in news API: {e}")
        return {"error": str(e)}
    finally:
        db.close()
