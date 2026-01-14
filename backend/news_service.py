import requests
import xml.etree.ElementTree as ET
try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️ Transformers/Torch not installed. Using TextBlob fallback.")

from textblob import TextBlob
import re
from datetime import datetime
from sqlalchemy.orm import Session
from database import NewsArticle

# --- AI Configuration ---
MODEL_NAME = "w11wo/indonesian-roberta-base-sentiment-classifier"
tokenizer = None
model = None

POSITIVE_KEYWORDS = [
    "melesat", "cuan", "untung", "naik", "positif", "tumbuh", "menguat", "hijau", "bullish", "dividen",
    "menarik", "menjanjikan", "laba", "rekor", "terpercaya", "optimis", "kokoh", "potensial", "melonjak",
    "terbang", "signifikan", "kinerja", "rekomendasi", "buy", "beli", "bagus", "prospek", "peluang", "topang"
]
NEGATIVE_KEYWORDS = [
    "anjlok", "rugi", "turun", "negatif", "merah", "bearish", "boncos", "kebakaran", "gagal", "lemah",
    "lesu", "tertekan", "waspada", "gejolak", "hancur", "phk", "bangkrut", "risk", "risiko", "utang",
    "beban", "sell", "jual", "suspend", "masalah", "aksi", "koreksi"
]

def load_ai_model():
    global tokenizer, model
    if not TRANSFORMERS_AVAILABLE:
        print("⚠️ AI Model Skipped (Dependencies missing). Using TextBlob mode.")
        return

    if model is None:
        print("🤖 Loading AI Model (Indonesian RoBERTa)...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
            print("✅ AI Model Loaded Successfully!")
        except Exception as e:
            print(f"❌ Failed to load AI model: {e}")

def analyze_sentiment_bert(text):
    text_lower = text.lower()
    
    # 1. PRIORITY: Check Keywords First
    for word in POSITIVE_KEYWORDS:
        if word in text_lower:
            return {"label": "POSITIVE", "score": 0.95}
    for word in NEGATIVE_KEYWORDS:
        if word in text_lower:
            return {"label": "NEGATIVE", "score": 0.95}

    # 2. SECONDARY: Use AI Model if available
    if model and tokenizer:
        try:
            inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
            with torch.no_grad():
                output = model(**inputs)
            
            scores = output.logits[0].softmax(dim=0).numpy()
            labels = model.config.id2label
            
            ranking = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
            top_label_id = ranking[0]
            
            # Robust label extraction
            top_label_str = "NEUTRAL"
            if isinstance(labels, dict):
                top_label_str = str(labels.get(top_label_id, "NEUTRAL")).upper()
            else:
                 top_label_str = "NEUTRAL"

            confidence = float(scores[top_label_id])
            
            final_label = "NEUTRAL"
            if "POSITIVE" in top_label_str or "LABEL_2" in top_label_str: 
                final_label = "POSITIVE"
            elif "NEGATIVE" in top_label_str or "LABEL_0" in top_label_str:
                final_label = "NEGATIVE"
            elif "NEUTRAL" in top_label_str or "LABEL_1" in top_label_str:
                final_label = "NEUTRAL"
                
            sentiment_score = confidence if final_label == "POSITIVE" else -confidence if final_label == "NEGATIVE" else 0
            return {"label": final_label, "score": sentiment_score}
            
        except Exception as e:
            print(f"AI Error: {e}")

    # 3. FALLBACK: TextBlob (Simple Polarity)
    try:
        blob = TextBlob(text_lower)
        # Translate to English for better TextBlob accuracy? Optional, but TextBlob default is English.
        # Assuming content is Indonesian, TextBlob might be weak.
        # But for Vercel demo, it's better than nothing.
        score = blob.sentiment.polarity 
        
        label = "NEUTRAL"
        if score > 0.1: label = "POSITIVE"
        elif score < -0.1: label = "NEGATIVE"
        
        return {"label": label, "score": score}
    except Exception:
        return {"label": "NEUTRAL", "score": 0.0}

def fetch_google_news(query: str, limit: int = 10):
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"
    
    try:
        response = requests.get(rss_url, timeout=10)
        root = ET.fromstring(response.content)
        articles = []
        
        for item in root.findall(".//item")[:limit]:
            title = item.find("title").text
            link = item.find("link").text
            pub_date = item.find("pubDate").text
            
            description_elem = item.find("description")
            description_text = ""
            if description_elem is not None and description_elem.text:
                raw_desc = description_elem.text
                description_text = re.sub('<[^<]+?>', '', raw_desc)
                description_text = description_text.replace("&nbsp;", " ").strip()

            full_text_for_ai = f"{title}. {description_text}"
            sentiment = analyze_sentiment_bert(full_text_for_ai)
            
            source_parts = title.rsplit("-", 1)
            source = source_parts[1].strip() if len(source_parts) > 1 else "Unknown"
            clean_title = source_parts[0].strip()
            
            articles.append({
                "title": clean_title,
                "description": description_text[:150] + "..." if len(description_text) > 150 else description_text,
                "source": source,
                "link": link,
                "published_at": pub_date,
                "sentiment_label": sentiment["label"],
                "sentiment_score": sentiment["score"]
            })
            
        return articles
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []

def save_articles_to_db(db: Session, articles: list, related_stock: str = "Global"):
    """
    Saves a list of article dicts to the database.
    """
    count = 0
    for article in articles:
        # Check if link exists
        existing = db.query(NewsArticle).filter(NewsArticle.link == article['link']).first()
        
        if not existing:
            try:
                 pub_date = datetime.strptime(article['published_at'], "%a, %d %b %Y %H:%M:%S %Z")
            except:
                 pub_date = datetime.utcnow()

            db_article = NewsArticle(
                title=article['title'],
                description=article['description'],
                source=article['source'],
                link=article['link'],
                published_at=pub_date,
                sentiment_label=article['sentiment_label'],
                sentiment_score=article['sentiment_score'],
                related_stock=related_stock
            )
            db.add(db_article)
            count += 1
    
    db.commit()
    return count
