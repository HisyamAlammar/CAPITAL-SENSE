import json
import os
from pathlib import Path

from dotenv import load_dotenv
from litellm import completion


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env", override=True)


SYSTEM_PROMPT = """
You are Capital Sense AI, a financial news intelligence model for Indonesian stock-market news.

Analyze each supplied article title and description.

Return exactly one valid JSON object, with no markdown fences and no extra text.
The root object must contain exactly one key: "articles".
"articles" must be an array with the same length and order as the input articles.
Each item in "articles" must contain exactly these keys:
sentiment_label, sentiment_score, summary, event_type, market_impact, ai_rationale.
sentiment_label must be POSITIVE, NEUTRAL, or NEGATIVE.
sentiment_score must be a number between -1.0 and 1.0.
market_impact must be LOW, MEDIUM, or HIGH.
"""


def get_ai_model_name():
    configured_model = os.getenv("AI_MODEL", "gemini-1.5-flash").strip()
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()

    if not configured_model:
        configured_model = "gemini-1.5-flash"

    if "/" in configured_model or not provider:
        return configured_model

    return f"{provider}/{configured_model}"


def main():
    payload = {
        "articles": [
            {
                "title": "IHSG anjlok 2% hari ini",
                "description": "Indeks Harga Saham Gabungan melemah tajam karena tekanan jual investor.",
                "source": "Capital Sense Test",
                "published_at": "Wed, 13 May 2026 09:00:00 GMT",
            }
        ]
    }

    response = completion(
        model=get_ai_model_name(),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
        timeout=20,
        num_retries=1,
        drop_params=True,
    )

    print("RAW RESPONSE:")
    print(response)

    try:
        print("\nMESSAGE CONTENT:")
        print(response.choices[0].message.content)
    except (AttributeError, IndexError, TypeError):
        pass


if __name__ == "__main__":
    main()
