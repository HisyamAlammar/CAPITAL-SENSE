from fastapi import APIRouter
import yfinance as yf
# from .news import analyze_sentiment_bert # Unused
from news_service import analyze_sentiment_bert

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.get("/prediction/{symbol}")
async def get_stock_prediction(symbol: str):
    """
    Generate Advanced AI Prediction based on 3 Pillars:
    1. Technical (Trend, MA)
    2. Fundamental (Valuation, Profitability)
    3. Sentiment (News, Market Mood)
    """
    ticker = f"{symbol.upper()}.JK"
    
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        info = stock.info
        
        if hist.empty:
            return {"error": "No data found"}
            
        current_price = hist["Close"].iloc[-1]
        
        # --- 1. Technical Analysis (30%) ---
        ma5 = hist["Close"].tail(5).mean()
        ma20 = hist["Close"].mean()
        
        tech_score = 0
        tech_reasons = []
        
        if ma5 > ma20:
            tech_score += 1
            tech_reasons.append("MA5 > MA20 (Uptrend)")
        if current_price > ma20:
            tech_score += 1
            tech_reasons.append("Price > MA20")
            
        tech_signal = "NEUTRAL"
        if tech_score == 2: tech_signal = "BULLISH"
        elif tech_score == 0: tech_signal = "BEARISH"

        # --- 2. Fundamental Analysis (40%) ---
        fund_score = 0
        fund_reasons = []
        
        per = info.get("trailingPE", 0)
        pbv = info.get("priceToBook", 0)
        roe = info.get("returnOnEquity", 0)
        div = info.get("dividendYield", 0)
        
        # Valuation
        if per > 0 and per < 15: 
            fund_score += 1
            fund_reasons.append("PER Rendah")
        elif per > 35: fund_score -= 1
        
        if pbv > 0 and pbv < 1.5: 
            fund_score += 1
            fund_reasons.append("PBV Undervalued")
            
        # Profitability
        if roe and roe > 0.15: # 15%
            fund_score += 1
            fund_reasons.append("ROE Tinggi")
            
        # Dividend
        if div and div > 0.03: # 3%
            fund_score += 1
            fund_reasons.append("Dividen Menarik")

        fund_signal = "NEUTRAL"
        if fund_score >= 3: fund_signal = "STRONG"
        elif fund_score >= 1: fund_signal = "GOOD"
        elif fund_score < 0: fund_signal = "WEAK"

        # --- 3. Sentiment & Macro (30%) ---
        # Fetch generic news for sentiment
        from news_service import fetch_google_news
        stock_news = fetch_google_news(f"{symbol} saham", limit=5)
        
        pos_news = len([n for n in stock_news if n['sentiment_label'] == 'POSITIVE'])
        neg_news = len([n for n in stock_news if n['sentiment_label'] == 'NEGATIVE'])
        
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

        # --- Final Calculation ---
        # Max Score: Tech(2) + Fund(4) + Sent(1) = 7
        total_score = tech_score + fund_score + sent_score
        max_score = 7
        
        confidence = min(max(50 + (total_score * 7), 10), 98) # Normalize to 10-98%
        
        # Prediction Logic
        if total_score >= 4:
            prediction = "STRONG BUY" if total_score >= 5 else "BUY"
            direction = "UP"
        elif total_score <= 1:
            prediction = "STRONG SELL" if total_score <= -1 else "SELL"
            direction = "DOWN"
        else:
            prediction = "HOLD"
            direction = "SIDEWAYS"
            
        # AI Price Projection (3 Months)
        # Logic: Current * (100% + (Score/MaxScore * VolatilityFactor))
        volatility = 0.15 # Assume 15% volatility cap for 3 months
        
        if direction == "UP":
            projected_change = (total_score / max_score) * volatility
        elif direction == "DOWN":
            projected_change = (total_score / max_score) * volatility # total_score is low/neg, so this works if formalized
            # To be safe for neg scores:
            if total_score > 0: projected_change = 0.02
            else: projected_change = -0.05 # Fallback
        else:
            projected_change = 0.02 # Slight inflation adjustment for Hold
            
        projected_price = current_price * (1 + projected_change)

        return {
            "symbol": symbol.upper(),
            "price": current_price,
            "prediction": prediction,
            "confidence": f"{int(confidence)}%",
            "target_price": int(projected_price),
            "signals": {
                "technical": f"{tech_signal} ({', '.join(tech_reasons)})",
                "fundamental": f"{fund_signal} ({', '.join(fund_reasons)})",
                "sentiment": f"{'BULLISH' if sent_score > 0 else 'BEARISH' if sent_score < 0 else 'NEUTRAL'} ({', '.join(sent_reasons)})",
                "ma_5": round(ma5, 0),
                "ma_20": round(ma20, 0)
            }
        }
        
    except Exception as e:
        print(f"Error in prediction: {e}")
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
        
        # 3. Key Topics (Most frequent words in titles)
        all_text = " ".join([a.title for a in articles]).lower()
        words = re.findall(r'\w+', all_text)
        ignored = ["di", "ke", "dan", "yang", "ini", "itu", "saham", "untuk", "pt", "tbk", "indonesia", "dengan", "akan", "pada", "market", "bursa", "news", "hari", "juta", "miliar", "triliun", "rp"]
        keywords = [w for w in words if w not in ignored and len(w) > 3]
        top_topics = Counter(keywords).most_common(3)
        # Custom formatting: IHSG capitalized, others Title Case
        topic_str = ", ".join([t[0].upper() if t[0].lower() == 'ihsg' else t[0].title() for t in top_topics])
        
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
