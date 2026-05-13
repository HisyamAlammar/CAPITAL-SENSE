# Capital Sense

**AI-Powered Indonesian Stock Intelligence for retail investors.**

Capital Sense is a full-stack stock intelligence platform built for the Indonesian market. It combines IDX market data, portfolio tracking, financial news ingestion, AI-enriched sentiment analysis, and a transparent **3-Pillar Prediction System** to help retail investors reason about stocks with less emotional bias.

This is not a template CRUD app. It is an applied AI product architecture: a Next.js frontend, a FastAPI backend, Neon PostgreSQL persistence, scheduled data ingestion, and a LiteLLM-based enrichment pipeline capable of routing workloads to Gemini, OpenAI, GLM, or 100B+ MoE-class models through OpenRouter.

> Academic scope: Capital Sense is a bootcamp/capstone project for educational analysis. It is not financial advice.

## Why This Exists

Indonesian retail investors often make decisions from fragmented information: price movement, social media noise, news headlines, and incomplete fundamental context. That creates a high-risk decision loop where emotion can dominate evidence.

Capital Sense addresses that by turning raw market signals into structured, explainable intelligence.

The core product value is the **3-Pillar Prediction System**:

1. **Technical Pillar**
   Uses recent price history to evaluate trend direction, momentum, and moving-average behavior.

2. **Fundamental Pillar**
   Uses valuation and company-quality metrics such as PER, PBV, ROE, dividend yield, market cap, free float, and shareholder composition.

3. **AI Sentiment Pillar**
   Uses AI-enriched financial news to classify sentiment, summarize events, estimate market impact, and explain the rationale behind the signal.

The output is intentionally explainable. Instead of presenting a mysterious "AI says buy" result, Capital Sense shows the signals behind the recommendation so users can understand the tradeoff between price action, business quality, and market narrative.

## Business Value

Capital Sense is designed around one simple thesis:

**Retail investors do not need more noise. They need structured conviction.**

The platform reduces emotional bias by:

- Converting scattered news headlines into normalized sentiment and event categories.
- Separating price momentum from business fundamentals.
- Showing whether a stock signal is supported by one pillar or multiple pillars.
- Replacing hype-driven decisions with a repeatable analysis framework.
- Making AI output auditable through summaries, impact labels, and rationale fields.

For a hiring manager or senior engineer reviewing this project, the key point is that the AI layer is not decorative. It is embedded into the data lifecycle and directly improves the product's analytical surface.

## Architecture Overview

Capital Sense uses a decoupled architecture so the user interface stays fast while heavier AI processing happens outside the request path.

```txt
Google News RSS / yfinance
          |
          v
FastAPI ingestion services
          |
          v
APScheduler background jobs
          |
          v
LiteLLM enrichment pipeline
          |
          v
Neon Serverless PostgreSQL
          |
          v
FastAPI JSON APIs
          |
          v
Next.js 14 frontend
```

### Zero-Latency AI Rendering Strategy

The frontend does not wait for an LLM response during page rendering. News enrichment runs in the background before records are persisted, then the UI reads already-enriched data from PostgreSQL.

This enables:

- Fast news page rendering with ordinary database reads.
- Stable UX even when external AI providers are slow.
- Provider flexibility through LiteLLM.
- OpenRouter support for 100B+ MoE-class models without coupling the product logic to one vendor SDK.
- Graceful fallback when AI enrichment fails, because the original RSS article is still stored.

### Backend Responsibilities

The FastAPI backend owns:

- Stock data retrieval and transformation.
- News ingestion from Google News RSS.
- AI enrichment before database persistence.
- 3-pillar prediction endpoints.
- Daily market recap generation.
- Portfolio APIs.
- Review/admin APIs.
- Scheduler startup and shutdown lifecycle.

### Frontend Responsibilities

The Next.js frontend owns:

- Market dashboard rendering.
- Stock detail pages and charting.
- Portfolio visualization.
- AI-enriched news cards.
- Daily market recap display.
- Beta login and admin access flows.

## Feature Highlights

- **Real-time stock monitoring**
  Search and monitor Indonesian stock symbols, price movement, gainers, losers, and market context.

- **Interactive stock detail pages**
  Lightweight Charts-powered charting with technical context and stock identity metadata.

- **3-Pillar AI Prediction**
  Combines technical trend, fundamental health, and AI news sentiment into an explainable educational signal.

- **AI News Enrichment**
  Each news item can include sentiment, Indonesian summary, event type, market impact, and AI rationale.

- **Daily Market Recap**
  Converts market news and sentiment into a readable daily overview.

- **Portfolio Management**
  Tracks holdings, average price, current value, profit/loss, and asset-level performance.

- **Private Beta Flow**
  Simple gated access for controlled capstone demos and review sessions.

## Modern Tech Stack

### Frontend

- **Next.js 14 App Router**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Lightweight Charts**
- **Recharts**
- **Framer Motion**
- **Axios**

### Backend

- **FastAPI**
- **SQLAlchemy**
- **Neon Serverless PostgreSQL**
- **APScheduler**
- **httpx**
- **yfinance**
- **LiteLLM**

### AI Infrastructure

- **LiteLLM** as the provider-agnostic abstraction layer.
- **OpenRouter** for routing to large frontier and MoE-class models.
- **Gemini/OpenAI/GLM-compatible configuration** through environment variables.
- Prompt-level structured JSON enforcement for cross-provider resilience.

## Repository Structure

```txt
.
|-- backend/
|   |-- main.py
|   |-- database.py
|   |-- news_service.py
|   |-- worker.py
|   |-- test_ai_provider.py
|   `-- routers/
|       |-- analysis.py
|       |-- news.py
|       |-- portfolio.py
|       |-- reviews.py
|       `-- stocks.py
|
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- middleware.ts
|   |-- package.json
|   `-- .env.example
|
|-- AUDIT_REPORT_V1.md
`-- README.md
```

## Developer Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- Neon PostgreSQL database URL
- At least one AI provider key for enrichment

## Backend Setup

From the project root:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgresql://user:password@ep-host.region.aws.neon.tech/dbname?sslmode=require

ADMIN_API_TOKEN=change-this-shared-admin-api-token
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_PER_MINUTE=60

AI_PROVIDER=openrouter
AI_MODEL=openrouter/provider/model-slug
OPENROUTER_API_KEY=your-openrouter-api-key

GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

PORT=8000
```

Provider examples:

```env
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your-gemini-api-key
```

```env
AI_PROVIDER=openai
AI_MODEL=gpt-5.5
OPENAI_API_KEY=your-openai-api-key
```

```env
AI_PROVIDER=openrouter
AI_MODEL=openrouter/provider/model-slug
OPENROUTER_API_KEY=your-openrouter-api-key
```

Run the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### AI Provider Smoke Test

Use the standalone test script before starting the full application:

```bash
python test_ai_provider.py
```

The script loads `backend/.env`, sends a dummy Indonesian financial headline through LiteLLM, and prints the raw model response. This validates provider credentials and model configuration without risking the FastAPI runtime.

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

ACCESS_CODE=change-this-beta-access-code
ADMIN_ACCESS_CODE=change-this-admin-access-code
ADMIN_API_TOKEN=change-this-shared-admin-api-token
```

Run the frontend:

```bash
npm run dev
```

Open the app:

```txt
http://localhost:3000
```

## Quality Gates

Backend syntax check:

```bash
python -m py_compile backend/main.py backend/database.py backend/news_service.py backend/worker.py
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Environment Reference

### Backend

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon/PostgreSQL connection string. |
| `ADMIN_API_TOKEN` | Shared token for protected admin API access. |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist. |
| `RATE_LIMIT_PER_MINUTE` | Basic per-IP backend rate limit. |
| `AI_PROVIDER` | LiteLLM provider prefix, such as `gemini`, `openai`, or `openrouter`. |
| `AI_MODEL` | Provider model name or full LiteLLM model string. |
| `GEMINI_API_KEY` | Gemini API key when using Gemini. |
| `OPENAI_API_KEY` | OpenAI API key when using OpenAI. |
| `OPENROUTER_API_KEY` | OpenRouter API key when routing to OpenRouter models. |
| `PORT` | Optional runtime port. |

### Frontend

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public backend base URL used by browser-side Axios calls. |
| `ACCESS_CODE` | Private beta login code. |
| `ADMIN_ACCESS_CODE` | Admin login code. |
| `ADMIN_API_TOKEN` | Shared token used by the frontend admin proxy. |

## Engineering Notes

- AI enrichment is intentionally placed in the background ingestion path instead of the UI request path.
- LiteLLM keeps provider selection out of business logic.
- The database stores enriched news fields so the frontend can render AI insights with normal API latency.
- The prediction engine remains explainable and auditable, which is important for both capstone defense and real-world product trust.
- Secrets are excluded through `.gitignore`; production deployments should use managed secret storage.

## Disclaimer

Capital Sense is built for education, research, and portfolio demonstration. It does not provide financial advice, investment recommendations, or guaranteed predictions. All outputs should be treated as analytical assistance, not trading instructions.
