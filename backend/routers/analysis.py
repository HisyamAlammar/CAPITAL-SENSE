import asyncio
import math
import random
import re
from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter
import yfinance as yf

from database import NewsArticle, SessionLocal
from news_service import fetch_google_news


router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def sanitize_for_json(data):
    if isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    elif isinstance(data, dict):
        return {k: sanitize_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_for_json(item) for item in data]
    return data


def _safe_int(value, default=None):
    try:
        if value is None:
            return default
        value = float(value)
        if math.isnan(value) or math.isinf(value):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_market_cap(value):
    try:
        if value is None:
            return 0
        value = float(value)
        if math.isnan(value) or math.isinf(value):
            return 0
        return value
    except (TypeError, ValueError):
        return 0


def _fetch_prediction_market_data_sync(ticker: str):
    stock = yf.Ticker(ticker)
    return stock.history(period="1mo"), stock.info


def _build_prediction_response(symbol: str, timeframe: str, hist, info, stock_news: list):
    if hist.empty:
        return {"error": "No data found"}

    current_price = float(hist["Close"].iloc[-1])
    ma5 = float(hist["Close"].tail(5).mean())
    ma20 = float(hist["Close"].mean())

    tech_score = 0
    tech_reasons = []

    if ma5 > ma20:
        tech_score += 1
        tech_reasons.append("MA5 > MA20 (Uptrend)")
    if current_price > ma20:
        tech_score += 1
        tech_reasons.append("Price > MA20")

    tech_signal = "NEUTRAL"
    if tech_score == 2:
        tech_signal = "BULLISH"
    elif tech_score == 0:
        tech_signal = "BEARISH"

    fund_score = 0
    fund_reasons = []

    per = info.get("trailingPE", 0)
    pbv = info.get("priceToBook", 0)
    roe = info.get("returnOnEquity", 0)
    div = info.get("dividendYield", 0)

    if per > 0 and per < 15:
        fund_score += 1
        fund_reasons.append("PER Rendah")
    elif per > 35:
        fund_score -= 1

    if pbv > 0 and pbv < 1.5:
        fund_score += 1
        fund_reasons.append("PBV Undervalued")

    if roe and roe > 0.15:
        fund_score += 1
        fund_reasons.append("ROE Tinggi")

    if div and div > 0.03:
        fund_score += 1
        fund_reasons.append("Dividen Menarik")

    fund_signal = "NEUTRAL"
    if fund_score >= 3:
        fund_signal = "STRONG"
    elif fund_score >= 1:
        fund_signal = "GOOD"
    elif fund_score < 0:
        fund_signal = "WEAK"

    pos_news = len([n for n in stock_news if n["sentiment_label"] == "POSITIVE"])
    neg_news = len([n for n in stock_news if n["sentiment_label"] == "NEGATIVE"])

    sent_score = 0
    sent_reasons = []
    if pos_news > neg_news:
        sent_score += 1
        sent_reasons.append(f"Berita Positif Dominan ({pos_news} vs {neg_news})")
    elif neg_news > pos_news:
        sent_score -= 1
        sent_reasons.append(f"Berita Negatif Dominan ({neg_news} vs {pos_news})")
    else:
        sent_reasons.append("Sentimen Berita Netral")

    total_score = tech_score + fund_score + sent_score
    max_score = 7
    confidence = min(max(50 + (total_score * 7), 10), 98)

    if total_score >= 4:
        prediction = "STRONG BUY" if total_score >= 5 else "BUY"
        direction = "UP"
    elif total_score <= 1:
        prediction = "STRONG SELL" if total_score <= -1 else "SELL"
        direction = "DOWN"
    else:
        prediction = "HOLD"
        direction = "SIDEWAYS"

    volatility = {
        "1m": 0.05,
        "3m": 0.15,
        "6m": 0.25,
    }.get(timeframe, 0.15)

    if direction == "UP":
        projected_change = (total_score / max_score) * volatility
    elif direction == "DOWN":
        projected_change = 0.02 if total_score > 0 else -(volatility / 3)
    else:
        projected_change = 0.02

    projected_price = current_price * (1 + projected_change)
    timeframe_label = {
        "1m": "1 Bulan",
        "3m": "3 Bulan",
        "6m": "6 Bulan",
    }.get(timeframe, "3 Bulan")

    return sanitize_for_json({
        "symbol": symbol.upper(),
        "price": current_price,
        "prediction": prediction,
        "confidence": f"{int(confidence)}%",
        "target_price": _safe_int(projected_price),
        "timeframe": timeframe_label,
        "signals": {
            "technical": f"{tech_signal} ({', '.join(tech_reasons)})",
            "fundamental": f"{fund_signal} ({', '.join(fund_reasons)})",
            "sentiment": f"{'BULLISH' if sent_score > 0 else 'BEARISH' if sent_score < 0 else 'NEUTRAL'} ({', '.join(sent_reasons)})",
            "ma_5": round(ma5, 0),
            "ma_20": round(ma20, 0),
        },
        "market_cap": info.get("marketCap", 0),
    })


def _rank_top_picks(results: list):
    def get_score(item):
        confidence = int(item["confidence"].replace("%", ""))
        label = item["prediction"]
        score = 0
        if "STRONG BUY" in label:
            score = 3
        elif "BUY" in label:
            score = 2
        elif "STRONG SELL" in label:
            score = -2
        elif "SELL" in label:
            score = -1
        return score, confidence

    buys = [r for r in results if "BUY" in r["prediction"]]
    sells = [r for r in results if "SELL" in r["prediction"]]
    hidden_gem_cap = 10 * 1_000_000_000_000
    very_hidden_gems = [r for r in buys if _safe_market_cap(r.get("market_cap")) < hidden_gem_cap]

    buys.sort(key=get_score, reverse=True)
    very_hidden_gems.sort(key=get_score, reverse=True)
    sells.sort(key=lambda x: (get_score(x)[0], -get_score(x)[1]))

    return {
        "buys": buys[:6],
        "sells": sells[:6],
        "hidden_gems": very_hidden_gems[:6],
    }


def _fetch_daily_recap_rows_sync():
    db = SessionLocal()
    try:
        since = datetime.utcnow() - timedelta(days=1)
        articles = db.query(NewsArticle).filter(NewsArticle.published_at >= since).all()
        return [
            {
                "title": article.title,
                "sentiment_label": article.sentiment_label,
                "related_stock": article.related_stock,
            }
            for article in articles
        ]
    finally:
        db.close()


def _build_daily_recap(articles: list):
    if not articles:
        return {"recap": "Belum ada cukup data berita hari ini untuk membuat rangkuman. Pasar terlihat tenang."}

    total = len(articles)
    pos = len([a for a in articles if a["sentiment_label"] == "POSITIVE"])
    neg = len([a for a in articles if a["sentiment_label"] == "NEGATIVE"])
    sentiment_score = pos - neg
    all_text = " ".join([a["title"] for a in articles])

    interesting_tickers = [
        "BBCA", "BBRI", "BMRI", "BBNI", "ARTO", "BRIS", "GOTO", "EMTK", "BUKA", "DCII",
        "ADRO", "PGAS", "PTBA", "ANTM", "TINS", "INCO", "MEDC", "UNVR", "ICBP", "INDF",
        "AMRT", "MYOR", "KLBF", "TLKM", "ISAT", "EXCL", "JSMR", "ASII", "UNTR", "IHSG",
        "BREN", "TPIA", "BYAN",
    ]

    found_tickers = []
    for word in all_text.split():
        clean_word = re.sub(r"\W+", "", word).upper()
        if clean_word in interesting_tickers:
            found_tickers.append(clean_word)

    if found_tickers:
        top_topics = Counter(found_tickers).most_common(3)
        topic_str = ", ".join([t[0] for t in top_topics])
    else:
        words = re.findall(r"\w+", all_text.lower())
        ignored = [
            "di", "ke", "dan", "yang", "ini", "itu", "saham", "untuk", "pt", "tbk", "indonesia", "dengan", "akan", "pada",
            "market", "bursa", "news", "hari", "juta", "miliar", "triliun", "rp", "persen", "naik", "turun", "stagnan",
            "sesi", "pagi", "siang", "sore", "penutupan", "pembukaan", "transaksi", "investor", "asing", "dana",
            "rekomendasi", "target", "harga", "potensi", "proyeksi", "prediksi", "jadwal", "dividen", "rups", "ipo",
        ]
        keywords = [w for w in words if w not in ignored and len(w) > 3 and not w.isdigit()]
        top_topics = Counter(keywords).most_common(1)
        topic_str = top_topics[0][0].title() if top_topics else "Ekonomi Global"

    stock_counts = Counter([a["related_stock"] for a in articles if a["related_stock"] != "Global"])
    top_stock = stock_counts.most_common(1)
    top_stock_name = top_stock[0][0] if top_stock else "Blue Chip"

    if sentiment_score > total * 0.2:
        mood = "Optimis"
        desc = "didominasi sentimen positif"
    elif sentiment_score < -total * 0.2:
        mood = "Waspada"
        desc = "cenderung tertekan"
    else:
        mood = "Netral"
        desc = "bergerak sideways/netral"

    recap_text = (
        f"Market Recap Hari Ini: Pasar terlihat **{mood}** dan {desc}. "
        f"Fokus investor tertuju pada isu **{topic_str}**. "
        f"Saham **{top_stock_name}** menjadi sorotan utama dalam pemberitaan 24 jam terakhir."
    )

    return {
        "mood": mood,
        "sentiment_score": sentiment_score,
        "top_topic": topic_str,
        "recap": recap_text,
    }


@router.get("/prediction/{symbol}")
async def get_stock_prediction(symbol: str, timeframe: str = "3m"):
    ticker = f"{symbol.upper()}.JK"

    try:
        market_data_task = asyncio.create_task(asyncio.to_thread(_fetch_prediction_market_data_sync, ticker))
        news_task = asyncio.create_task(fetch_google_news(f"{symbol} saham", limit=5))
        (hist, info), stock_news = await asyncio.gather(market_data_task, news_task)
        return sanitize_for_json(_build_prediction_response(symbol, timeframe, hist, info, stock_news))
    except Exception as e:
        print(f"Error in prediction: {e}")
        return {"error": str(e)}


@router.get("/top-picks")
async def get_top_picks():
    from routers.stocks import POPULAR_TICKERS, SMALL_CAP_TICKERS

    big_caps = random.sample([t.replace(".JK", "") for t in POPULAR_TICKERS], 12)
    small_caps = random.sample([t.replace(".JK", "") for t in SMALL_CAP_TICKERS], 8)
    all_tickers = big_caps + small_caps
    random.shuffle(all_tickers)

    semaphore = asyncio.Semaphore(4)

    async def guarded_prediction(symbol: str):
        async with semaphore:
            return await get_stock_prediction(symbol)

    results_raw = await asyncio.gather(
        *(guarded_prediction(symbol) for symbol in all_tickers),
        return_exceptions=True,
    )
    results = [r for r in results_raw if isinstance(r, dict) and "error" not in r]
    return sanitize_for_json(_rank_top_picks(results))


@router.get("/ipo-rumors")
async def get_ipo_rumors():
    ipo_news = await fetch_google_news("Rencana IPO Saham Indonesia", limit=6)
    filtered = [n for n in ipo_news if "IPO" in n["title"].upper() or "SAHAM" in n["title"].upper()]
    return filtered[:4]


@router.get("/recap")
async def get_daily_recap():
    try:
        articles = await asyncio.to_thread(_fetch_daily_recap_rows_sync)
        return _build_daily_recap(articles)
    except Exception as e:
        return {"error": str(e)}
