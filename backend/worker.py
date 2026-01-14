from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal, NewsArticle, init_db
from news_service import fetch_google_news, save_articles_to_db
from routers.stocks import POPULAR_TICKERS, get_market_summary
import asyncio

# Initialize DB
init_db()

async def update_all_news():
    print(f"[{datetime.now()}] 🔄 Starting Background News Update...")
    db = SessionLocal()
    
    try:
        # 1. Fetch Global Market News
        print("   -> Fetching Global Market News...")
        global_news = fetch_google_news("saham ekonomi indonesia", limit=10)
        save_articles_to_db(db, global_news, "Global")
            
        # 2. Smart Prefetch: Popular Stocks (Blue Chips)
        # We limit to top 5 to avoid rate limits from Google
        top_picks = ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK"]
        
        for ticker in top_picks:
            symbol = ticker.replace(".JK", "")
            print(f"   -> Fetching News for {symbol}...")
            stock_news = fetch_google_news(f"{symbol} saham", limit=5)
            save_articles_to_db(db, stock_news, symbol)
        
    except Exception as e:
        print(f"Error in background job: {e}")
    finally:
        db.close()
        print(f"[{datetime.now()}] ✅ Background Update Finished!")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run immediately on startup
    scheduler.add_job(lambda: asyncio.run(update_all_news()), 'interval', minutes=15)
    scheduler.start()
    
    # Run once on startup
    asyncio.create_task(update_all_news())
