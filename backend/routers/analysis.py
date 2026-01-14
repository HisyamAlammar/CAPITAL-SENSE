from fastapi import APIRouter
import yfinance as yf
# from .news import analyze_sentiment_bert # Unused
from news_service import analyze_sentiment_bert

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.get("/prediction/{symbol}")
async def get_stock_prediction(symbol: str):
    """
    Generate a simple prediction based on Technical (RSI/MA) + Fundamental (News Logic).
    """
    ticker = f"{symbol.upper()}.JK"
    
    try:
        # --- 1. Technical Analysis (40%) ---
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        
        technical_score = 0
        technical_signal = "NEUTRAL"
        
        if not hist.empty:
            current_price = hist["Close"].iloc[-1]
            ma_short = hist["Close"].tail(5).mean()
            ma_long = hist["Close"].mean()
            
            # Golden Cross Logic
            if current_price > ma_long: technical_score += 1
            if ma_short > ma_long: technical_score += 1
            
            if technical_score >= 2: technical_signal = "BULLISH"
            elif technical_score == 0: technical_signal = "BEARISH"
        else:
            return {"error": "No data found"}

        # --- 2. Micro Economics (Financials + News Sentiment) (40%) ---
        micro_score = 0
        micro_reason = []
        info = stock.info
        
        # A. Valuation (PER & PBV)
        per = info.get("trailingPE", 0)
        pbv = info.get("priceToBook", 0)
        
        if per > 0 and per < 15: 
            micro_score += 1
            micro_reason.append("Valuasi Murah")
        elif per > 35: 
            micro_score -= 1
            micro_reason.append("Valuasi Mahal")
            
        if pbv > 0 and pbv < 1.5: 
            micro_score += 1
            micro_reason.append("Aset Undervalued")
        elif pbv > 8: 
             micro_score -= 1

        # B. News Sentiment for Specific Stock
        # Dynamically fetch news for this symbol
        from news_service import fetch_google_news
        stock_news = fetch_google_news(f"{symbol} saham", limit=5) # Fetch 5 latest news
        
        pos_news = len([n for n in stock_news if n['sentiment_label'] == 'POSITIVE'])
        neg_news = len([n for n in stock_news if n['sentiment_label'] == 'NEGATIVE'])
        
        if pos_news > neg_news:
            micro_score += 1
            micro_reason.append(f"Sentimen Berita Positif ({pos_news} vs {neg_news})")
        elif neg_news > pos_news:
            micro_score -= 1
            micro_reason.append(f"Sentimen Berita Negatif ({neg_news} vs {pos_news})")
        
        micro_signal = "NEUTRAL"
        if micro_score >= 1: micro_signal = "STRONG"
        elif micro_score < 0: micro_signal = "WEAK"

        # --- 3. Macro Economics (Market Context) (20%) ---
        # Simulating Market Condition (IHSG Trend) based on general market tickers
        macro_signal = "NEUTRAL"
        macro_score = 0
        
        try:
            ihsg = yf.Ticker("^JKSE")
            ihsg_hist = ihsg.history(period="5d")
            if not ihsg_hist.empty:
                ihsg_change = (ihsg_hist["Close"].iloc[-1] - ihsg_hist["Close"].iloc[0]) / ihsg_hist["Close"].iloc[0]
                if ihsg_change > 0.005: 
                    macro_signal = "bullish (IHSG Hijau)"
                    macro_score = 1
                elif ihsg_change < -0.005: 
                    macro_signal = "bearish (IHSG Merah)"
                    macro_score = -1
        except:
            macro_signal = "neutral (Data IHSG N/A)"

        # --- Final Scoring ---
        # Tech (0-2) + Micro (-2 to 4) + Macro (-1 to 1) 
        
        total_score = technical_score + micro_score + macro_score
        
        final_prediction = "HOLD"
        confidence = 50
        
        if total_score >= 3:
            final_prediction = "POTENTIAL UP"
            confidence = min(60 + (total_score * 8), 95)
        elif total_score <= 0:
            final_prediction = "POTENTIAL DOWN"
            confidence = min(60 + (abs(total_score) * 8), 90)
        else:
            final_prediction = "HOLD / WATCH"
            confidence = 50
            
        return {
            "symbol": symbol.upper(),
            "price": current_price,
            "prediction": final_prediction,
            "confidence": f"{confidence}%",
            "signals": {
                "technical": technical_signal,
                "micro": f"{micro_signal} ({', '.join(micro_reason)})" if micro_reason else micro_signal,
                "macro": macro_signal,
                "ma_5": round(ma_short, 0),
                "ma_20": round(ma_long, 0)
            }
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/recap")
async def get_daily_recap():
    """
    Generate a 'Mad Libs' style AI Market Recap based on last 24h news.
    """
    from database import SessionLocal, NewsArticle
    from datetime import datetime, timedelta
    from collections import Counter
    import re
    
    db = SessionLocal()
    try:
        # 1. Fetch Last 24h News
        since = datetime.utcnow() - timedelta(days=1)
        articles = db.query(NewsArticle).filter(NewsArticle.published_at >= since).all()
        
        if not articles:
            return {"recap": "Belum ada cukup data berita hari ini untuk membuat rangkuman. Pasar terlihat tenang."}
            
        # 2. Aggregations
        total = len(articles)
        pos = len([a for a in articles if a.sentiment_label == "POSITIVE"])
        neg = len([a for a in articles if a.sentiment_label == "NEGATIVE"])
        sentiment_score = pos - neg
        
        # 3. Key Topics (Prioritize Indices/Tickers)
        all_text = " ".join([a.title for a in articles]).upper() # Upper for ticker matching
        
        # Priority Keywords
        priority_terms = ["IHSG", "JCI", "FED", "BI", "US TREASURY", "RUPIAH", "INFLASI"]
        
        # Add Popular Tickers
        from .stocks import POPULAR_TICKERS
        clean_tickers = [t.replace(".JK", "") for t in POPULAR_TICKERS]
        priority_terms.extend(clean_tickers)
        
        found_topics = []
        for term in priority_terms:
            if term in all_text:
                count = all_text.count(term)
                if count > 0:
                    found_topics.append((term, count))
                    
        # Sort by frequency
        found_topics.sort(key=lambda x: x[1], reverse=True)
        top_matches = found_topics[:3]
        
        if top_matches:
            topic_str = ", ".join([t[0] for t in top_matches])
        else:
             # Fallback to old method (Common words)
             words = re.findall(r'\w+', all_text.lower())
             ignored = ["di", "ke", "dan", "yang", "ini", "itu", "saham", "untuk", "pt", "tbk", "indonesia", "dengan", "akan", "pada", "market", "bursa", "news", "hari", "juta", "miliar", "triliun", "rp"]
             keywords = [w for w in words if w not in ignored and len(w) > 3]
             top_common = Counter(keywords).most_common(2)
             topic_str = ", ".join([t[0].title() for t in top_common])
        
        # 4. Top Stock (Most mentioned)
        stock_counts = Counter([a.related_stock for a in articles if a.related_stock != "Global"])
        top_stock = stock_counts.most_common(1)
        top_stock_name = top_stock[0][0] if top_stock else "Blue Chip"
        
        # 5. Determine Mood & Template
        if sentiment_score > total * 0.2:
            mood = "Optimis"
            icon = "🚀"
            desc = "didominasi sentimen positif"
        elif sentiment_score < -total * 0.2:
            mood = "Waspada"
            icon = "⚠️"
            desc = "cenderung tertekan"
        else:
            mood = "Netral"
            icon = "⚖️"
            desc = "bergerak sideways/netral"
            
        # 6. Generate Sentence
        recap_text = (
            f"{icon} **Market Recap Hari Ini**: Pasar terlihat **{mood}** dan {desc}. "
            f"Fokus investor tertuju pada isu **{topic_str}**. "
            f"Saham **{top_stock_name}** menjadi sorotan utama dalam pemberitaan 24 jam terakhir."
        )
        
        return {
            "mood": mood,
            "sentiment_score": sentiment_score,
            "top_topic": topic_str,
            "recap": recap_text
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
