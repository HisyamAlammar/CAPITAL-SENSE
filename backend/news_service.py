import asyncio
import json
import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime

import httpx
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import NewsArticle

try:
    from litellm import completion

    LITELLM_AVAILABLE = True
except ImportError:
    completion = None
    LITELLM_AVAILABLE = False
    print("LiteLLM not found. AI enrichment is disabled.")

try:
    from transformers import pipeline

    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Transformers/PyTorch not found. Using lightweight keyword analysis.")


MODEL_NAME = "w11wo/indonesian-roberta-base-sentiment-classifier"
tokenizer = None
model = None

AI_SYSTEM_PROMPT = """
You are Capital Sense AI, a financial news intelligence model for Indonesian stock-market news. Analyze each supplied article title and description.

For each article:
- Classify sentiment as POSITIVE, NEUTRAL, or NEGATIVE from an investor perspective.
- Give sentiment_score from -1.0 to 1.0.
- Summarize the article in one Indonesian sentence.
- Identify related IDX tickers if clearly mentioned or strongly implied.
- Classify event_type, such as earnings, dividend, regulation, macro, IPO, corporate action, analyst rating, commodity, or other.
- Estimate market_impact as LOW, MEDIUM, or HIGH.
- Explain briefly why the sentiment was chosen.

Use only the provided text. Do not invent ticker links or facts. Return structured JSON only.

STRICT JSON FORMAT:
- Return exactly one valid JSON object, with no markdown fences and no extra text.
- The root object must contain exactly one key: "articles".
- "articles" must be an array with the same length and order as the input articles.
- Each item in "articles" must contain exactly these keys:
  sentiment_label, sentiment_score, summary, event_type, market_impact, ai_rationale.
- sentiment_label must be POSITIVE, NEUTRAL, or NEGATIVE.
- sentiment_score must be a number between -1.0 and 1.0.
- market_impact must be LOW, MEDIUM, or HIGH.
"""

load_dotenv()

POSITIVE_KEYWORDS = [
    "melesat", "cuan", "untung", "naik", "positif", "tumbuh", "menguat", "hijau", "bullish", "dividen",
    "menarik", "menjanjikan", "laba", "rekor", "terpercaya", "optimis", "kokoh", "potensial", "melonjak",
    "terbang", "signifikan", "kinerja", "rekomendasi", "buy", "beli", "bagus", "prospek", "peluang", "topang",
]

NEGATIVE_KEYWORDS = [
    "anjlok", "rugi", "turun", "negatif", "merah", "bearish", "boncos", "kebakaran", "gagal", "lemah",
    "lesu", "tertekan", "waspada", "gejolak", "hancur", "phk", "bangkrut", "risk", "risiko", "utang",
    "beban", "sell", "jual", "suspend", "masalah", "aksi", "koreksi",
]


def load_ai_model():
    global tokenizer, model
    load_dotenv()

    if not TRANSFORMERS_AVAILABLE:
        return

    if model is None:
        print("Loading AI Model (Indonesian RoBERTa)...")
        try:
            hf_token = os.getenv("HF_TOKEN")
            model = pipeline(
                "sentiment-analysis",
                model=MODEL_NAME,
                tokenizer=MODEL_NAME,
                token=hf_token,
            )
            print("AI Model Loaded Successfully.")
        except Exception as e:
            print(f"Failed to load AI model: {e}")


def analyze_sentiment_bert(text):
    text_lower = text.lower()

    for word in POSITIVE_KEYWORDS:
        if word in text_lower:
            return {"label": "POSITIVE", "score": 0.95}

    for word in NEGATIVE_KEYWORDS:
        if word in text_lower:
            return {"label": "NEGATIVE", "score": 0.95}

    if TRANSFORMERS_AVAILABLE and model:
        try:
            result = model(text, truncation=True, max_length=512)[0]
            top_label_str = str(result.get("label", "NEUTRAL")).upper()
            confidence = float(result.get("score", 0.0))

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

    return {"label": "NEUTRAL", "score": 0.0}


def _get_ai_model_name():
    configured_model = os.getenv("AI_MODEL", "gemini-1.5-flash").strip()
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()

    if not configured_model:
        configured_model = "gemini-1.5-flash"

    if "/" in configured_model or not provider:
        return configured_model

    return f"{provider}/{configured_model}"


def _coerce_sentiment_label(value):
    value = str(value or "NEUTRAL").upper()
    if value not in {"POSITIVE", "NEUTRAL", "NEGATIVE"}:
        return "NEUTRAL"
    return value


def _coerce_sentiment_score(value, fallback):
    try:
        score = float(value)
        return max(min(score, 1.0), -1.0)
    except (TypeError, ValueError):
        return fallback


def _coerce_market_impact(value):
    value = str(value or "LOW").upper()
    if value not in {"LOW", "MEDIUM", "HIGH"}:
        return "LOW"
    return value


def _strip_json_fences(text: str):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_ai_json(text: str):
    parsed = json.loads(_strip_json_fences(text))

    if isinstance(parsed, dict):
        for key in ("articles", "data", "results"):
            if isinstance(parsed.get(key), list):
                return parsed[key]
        if {"sentiment_label", "sentiment_score", "summary", "event_type", "market_impact", "ai_rationale"}.issubset(parsed):
            return [parsed]

    if isinstance(parsed, list):
        return parsed

    raise ValueError("AI response does not contain an article array.")


def _extract_litellm_content(response):
    try:
        return response.choices[0].message.content or ""
    except (AttributeError, IndexError, TypeError):
        pass

    try:
        return response["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError):
        return ""


def _call_litellm_completion(payload: list[dict]):
    if completion is None:
        raise RuntimeError("LiteLLM is not available.")

    user_prompt = (
        "Analyze the following Indonesian stock-market news articles. "
        "Return only the strict JSON object requested by the system instruction.\n\n"
        f"{json.dumps({'articles': payload}, ensure_ascii=False)}"
    )

    return completion(
        model=_get_ai_model_name(),
        messages=[
            {"role": "system", "content": AI_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
        timeout=20,
        num_retries=1,
        drop_params=True,
    )


async def enrich_articles_with_ai(articles: list[dict]) -> list[dict]:
    if not articles or not LITELLM_AVAILABLE:
        return articles

    payload = [
        {
            "title": article.get("title", ""),
            "description": article.get("description", ""),
            "source": article.get("source", ""),
            "published_at": article.get("published_at", ""),
        }
        for article in articles
    ]

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(_call_litellm_completion, payload),
            timeout=25,
        )
        content = _extract_litellm_content(response)
        enriched_items = _parse_ai_json(content)
    except Exception as e:
        print(f"AI enrichment failed: {e}")
        return articles

    if len(enriched_items) != len(articles):
        print("AI enrichment returned a mismatched article count.")
        return articles

    enriched_articles = []
    for article, enriched in zip(articles, enriched_items):
        if not isinstance(enriched, dict):
            enriched_articles.append(article)
            continue

        fallback_score = article.get("sentiment_score", 0.0)
        merged = {
            **article,
            "sentiment_label": _coerce_sentiment_label(enriched.get("sentiment_label")),
            "sentiment_score": _coerce_sentiment_score(enriched.get("sentiment_score"), fallback_score),
            "summary": enriched.get("summary") or article.get("summary"),
            "event_type": str(enriched.get("event_type") or "other").lower(),
            "market_impact": _coerce_market_impact(enriched.get("market_impact")),
            "ai_rationale": enriched.get("ai_rationale") or article.get("ai_rationale"),
        }
        enriched_articles.append(merged)

    return enriched_articles


def _parse_google_news_xml(content: bytes, limit: int):
    root = ET.fromstring(content)
    articles = []

    for item in root.findall(".//item")[:limit]:
        title = item.findtext("title", "")
        link = item.findtext("link", "")
        pub_date = item.findtext("pubDate", "")
        raw_description = item.findtext("description", "")
        description_text = re.sub("<[^<]+?>", "", raw_description)
        description_text = description_text.replace("&nbsp;", " ").strip()

        sentiment = analyze_sentiment_bert(f"{title}. {description_text}")
        source_parts = title.rsplit("-", 1)

        articles.append({
            "title": source_parts[0].strip(),
            "description": description_text[:150] + "..." if len(description_text) > 150 else description_text,
            "source": source_parts[1].strip() if len(source_parts) > 1 else "Unknown",
            "link": link,
            "published_at": pub_date,
            "sentiment_label": sentiment["label"],
            "sentiment_score": sentiment["score"],
        })

    return articles


async def fetch_google_news(query: str, limit: int = 10):
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=id&gl=ID&ceid=ID:id"

    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
            response = await client.get(rss_url)
            response.raise_for_status()

        return await asyncio.to_thread(_parse_google_news_xml, response.content, limit)
    except Exception as e:
        print(f"Error fetching news for {query}: {e}")
        return []


def _parse_published_at(value: str):
    try:
        return datetime.strptime(value, "%a, %d %b %Y %H:%M:%S %Z")
    except Exception:
        return datetime.utcnow()


def save_articles_to_db(db: Session, articles: list, related_stock: str = "Global"):
    if not articles:
        return 0

    links = [article["link"] for article in articles if article.get("link")]
    if not links:
        return 0

    existing_links = {
        row[0]
        for row in db.query(NewsArticle.link)
        .filter(NewsArticle.link.in_(links))
        .all()
    }

    new_articles = []
    for article in articles:
        link = article.get("link")
        if not link or link in existing_links:
            continue

        new_articles.append(NewsArticle(
            title=article["title"],
            description=article["description"],
            summary=article.get("summary"),
            source=article["source"],
            link=link,
            published_at=_parse_published_at(article["published_at"]),
            sentiment_label=article["sentiment_label"],
            sentiment_score=article["sentiment_score"],
            event_type=article.get("event_type"),
            market_impact=article.get("market_impact"),
            ai_rationale=article.get("ai_rationale"),
            related_stock=related_stock,
        ))

    if not new_articles:
        return 0

    try:
        db.add_all(new_articles)
        db.commit()
        return len(new_articles)
    except IntegrityError:
        db.rollback()
        return 0
