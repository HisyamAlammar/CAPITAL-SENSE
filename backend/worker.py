import asyncio
from datetime import datetime
from threading import Lock

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal, init_db
from news_service import enrich_articles_with_ai, fetch_google_news, save_articles_to_db


_news_update_lock = Lock()


def update_all_news():
    print(f"[{datetime.now()}] Starting Background News Update...")
    db = SessionLocal()

    try:
        global_news = asyncio.run(fetch_google_news("saham ekonomi indonesia", limit=10))
        global_news = asyncio.run(enrich_articles_with_ai(global_news))
        save_articles_to_db(db, global_news, "Global")

        for ticker in ["BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK"]:
            symbol = ticker.replace(".JK", "")
            stock_news = asyncio.run(fetch_google_news(f"{symbol} saham", limit=5))
            stock_news = asyncio.run(enrich_articles_with_ai(stock_news))
            save_articles_to_db(db, stock_news, symbol)
    except Exception as e:
        print(f"Error in background job: {e}")
    finally:
        db.close()
        print(f"[{datetime.now()}] Background Update Finished.")


def _run_update_all_news():
    if not _news_update_lock.acquire(blocking=False):
        print("Skipping background news update: previous job still running.")
        return

    try:
        update_all_news()
    finally:
        _news_update_lock.release()


def start_scheduler():
    init_db()
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        _run_update_all_news,
        "interval",
        minutes=15,
        id="news_update_interval",
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
        replace_existing=True,
    )
    scheduler.add_job(
        _run_update_all_news,
        "date",
        id="news_update_startup",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    scheduler.start()
    return scheduler
