# Capital Sense Audit Report V1

Audit date: 2026-05-13  
Scope: Full-stack codebase audit covering frontend, backend, database access, AI provider integration, worker behavior, environment hygiene, and build/test evidence.

## 1. Executive Summary

Overall health score: 68/100

Capital Sense is functionally strong for a university capstone demonstration. The system has a clear architecture, meaningful AI integration through LiteLLM, a working FastAPI backend, a production-compilable Next.js frontend, and a useful domain workflow around stock monitoring, news sentiment, and portfolio tracking.

The system is not yet production-grade. The largest risks are destructive database initialization, weak beta authentication, public mutation endpoints, local secret/artifact hygiene gaps, and frontend lint failures. Most backend database sessions are closed correctly, and the new AI enrichment layer has timeout/fallback protection, but several core modules still mix too many responsibilities.

## 2. Audit Evidence and Testing Logs

### Backend Syntax Check

Command:

```bash
python -m py_compile backend\main.py backend\database.py backend\news_service.py backend\worker.py backend\test_ai_provider.py backend\routers\analysis.py backend\routers\news.py backend\routers\stocks.py backend\routers\portfolio.py backend\routers\reviews.py
```

Result: Passed.

Backend virtualenv compile check:

```bash
backend\venv\Scripts\python.exe -m py_compile backend\main.py backend\database.py backend\news_service.py backend\worker.py backend\test_ai_provider.py backend\routers\analysis.py backend\routers\news.py backend\routers\stocks.py backend\routers\portfolio.py backend\routers\reviews.py
```

Result: Passed.

### AI Provider Smoke Test

Command:

```bash
python backend\test_ai_provider.py
```

Result: Failed before provider call. The system Python environment does not have `python-dotenv` installed.

Command:

```bash
backend\venv\Scripts\python.exe backend\test_ai_provider.py
```

Result: Failed before provider call. The backend virtualenv does not currently have `litellm` installed.

Provider status: No successful live OpenRouter/Gemini response was captured during this audit. This is an environment dependency issue, not proof of provider failure. Run `pip install -r backend/requirements.txt` inside the active backend environment, then rerun `python backend/test_ai_provider.py`.

### Frontend Lint

Command:

```bash
cd frontend
npm run lint
```

Result: Failed with 29 errors and 6 warnings.

Key failure categories:

- `react/no-unescaped-entities` in page and component text.
- `@typescript-eslint/no-explicit-any` in portfolio, stock detail, market recap, and fundamental card code.
- `react-hooks/static-components` because `MetricCard` is declared inside `FundamentalCard`.
- Unused imports such as `TrendingDown`, `Check`, `AnimatePresence`, and `RefreshCw`.

### Frontend Production Build

Command:

```bash
cd frontend
npm run build
```

Result: Passed.

Observed warning: Next.js 16.1.1 reports that the `middleware` file convention is deprecated and should migrate to `proxy`.

## 3. Detailed Findings

### CRITICAL-01: Startup Drops `news_articles` Table

Evidence: `backend/database.py` calls `NewsArticle.__table__.drop(bind=engine, checkfirst=True)` inside `init_db()`.

Impact: Every backend startup deletes all stored news, AI summaries, sentiment scores, and auditability history. This is acceptable only as a temporary open-beta schema reset, not as a stable deployment behavior.

Recommendation: Replace destructive startup reset with Alembic migrations or a one-time admin-only maintenance script.

### CRITICAL-02: Portfolio Mutation Endpoints Are Public

Evidence: `backend/routers/portfolio.py` exposes GET, POST, and DELETE portfolio endpoints without authentication.

Impact: Anyone who can reach the backend can read, create, or delete portfolio entries. This is a severe authorization gap if the backend is publicly deployed.

Recommendation: Require authenticated user context or at minimum the same beta/admin token scheme before allowing portfolio mutation.

### HIGH-01: Beta Authentication Is Role Cookie Only

Evidence: `frontend/app/api/auth/login/route.ts` sets `cs_session` to `user` or `admin`. `frontend/middleware.ts` trusts that cookie value.

Impact: The cookie is HTTP-only and secure in production, which is good, but it is not cryptographically signed as a session token with server-side validation. It is a lightweight beta gate, not enterprise authentication.

Recommendation: Replace with signed JWT/session storage, rotate secrets, add CSRF protection for state-changing routes, and add login throttling.

### HIGH-02: Git Ignore Rules Do Not Cover All Local Secrets and Runtime Artifacts

Evidence: `.gitignore` ignores `.env` but not `.env.local`, `*.db`, `.next`, or `node_modules`. Local files detected include `frontend/.env.local`, `backend/news.db`, and `frontend/backend/news.db`.

Impact: Accidental commits may leak secrets or commit large runtime artifacts.

Recommendation: Add `.env.local`, `.env.*.local`, `*.db`, `node_modules/`, `.next/`, and generated build artifacts to `.gitignore`. Remove already tracked sensitive files if any exist.

### HIGH-03: In-Memory Rate Limiting Is Not Production-Distributed

Evidence: `backend/main.py` uses a process-local `defaultdict(deque)` keyed by client IP.

Impact: Rate limits reset on restart and do not work across multiple instances. IP-based limiting can also be inaccurate behind proxies unless trusted proxy headers are handled correctly.

Recommendation: Use Redis or deployment-provider rate limiting, normalize client IP through trusted proxy configuration, and add endpoint-specific stricter limits for login, reviews, AI routes, and live search.

### HIGH-04: AI Enrichment JSON Handling Is Better but Still Provider-Fragile

Evidence: `backend/news_service.py` uses strict prompts, `response_format={"type": "json_object"}`, timeout handling, and JSON parsing fallback.

Impact: This is a good baseline, but LiteLLM provider support varies. The parser accepts several root shapes and does not validate a formal schema. A malformed provider response silently falls back to unenriched articles, which preserves uptime but hides quality failures.

Recommendation: Add Pydantic validation for AI output, structured logging for fallback rates, and provider health metrics. Consider LiteLLM schema validation where supported.

### HIGH-05: Frontend Lint Fails

Evidence: `npm run lint` failed with 29 errors and 6 warnings.

Impact: Build currently passes, but code quality gates fail. This weakens defense readiness and increases future regression risk.

Recommendation: Fix lint errors before final submission. Prioritize `any` types, unescaped entities, unused imports, and moving `MetricCard` outside `FundamentalCard`.

### MEDIUM-01: `news_service.py` Violates Single Responsibility

Evidence: The module handles RSS fetching, XML parsing, keyword sentiment, optional Transformer loading, LiteLLM prompting, JSON parsing, coercion, and database persistence.

Impact: The module is hard to test in isolation and hard to extend without side effects.

Recommendation: Split into `rss_client.py`, `sentiment_service.py`, `ai_enrichment_service.py`, `news_repository.py`, and `schemas.py`.

### MEDIUM-02: Worker Uses Repeated `asyncio.run()`

Evidence: `backend/worker.py` calls `asyncio.run()` for each RSS fetch and each AI enrichment call.

Impact: This is safe in the current synchronous APScheduler job, but inefficient and awkward. It creates and destroys event loops repeatedly.

Recommendation: Make the scheduled job call one async orchestration function once, or use `AsyncIOScheduler`.

### MEDIUM-03: 3-Pillar Prediction Logic Is Explainable but Fragile

Evidence: `backend/routers/analysis.py` uses fixed thresholds for PER, PBV, ROE, dividend yield, MA5/MA20, and sentiment counts.

Impact: The output is transparent, but it can overstate confidence and target price precision. Randomized top-picks sampling can produce inconsistent results between requests.

Recommendation: Add deterministic scoring configs, sector-aware valuation thresholds, confidence calibration, and cached top-picks snapshots.

### MEDIUM-04: Public News Endpoint Does Not Return New AI Enrichment Fields

Evidence: `backend/routers/news.py` returns title, description, source, link, published_at, sentiment_label, and sentiment_score, but not summary, event_type, market_impact, or ai_rationale.

Impact: The backend stores richer AI data, but the frontend cannot display it through the current endpoint.

Recommendation: Include the new AI fields in API response models and update frontend cards to show summary, impact, and rationale.

### MEDIUM-05: Frontend Uses Public Backend URL for State-Changing Portfolio Calls

Evidence: `frontend/app/portfolio/page.tsx` sends GET, POST, and DELETE requests directly to `NEXT_PUBLIC_API_URL`.

Impact: Browser-visible backend routes are directly callable outside the UI. This is acceptable for a demo only if backend auth is enforced, which it currently is not for portfolio.

Recommendation: Proxy sensitive mutations through Next.js server routes with session validation, or enforce auth directly in FastAPI.

### MEDIUM-06: CORS Uses Credentials With Configurable Origins

Evidence: `backend/main.py` sets `allow_credentials=True` and reads `ALLOWED_ORIGINS`.

Impact: This is acceptable when origins are strict. It becomes risky if production uses broad origins.

Recommendation: Never use wildcard origins with credentials. Keep production origins explicit and environment-reviewed.

### MEDIUM-07: Error Handling Sometimes Returns Raw Exception Strings

Evidence: Multiple backend routes return `{"error": str(e)}`.

Impact: This can leak provider, database, or upstream implementation details.

Recommendation: Return generic user-safe errors and log internal details server-side.

## 4. Resource Management Review

Positive findings:

- SQLAlchemy sessions are generally closed with `finally` blocks or FastAPI dependencies.
- `news_service.py` uses explicit HTTP and AI timeouts.
- React chart cleanup removes resize listeners and chart instances.
- Stock detail page uses `AbortController` for major requests.

Risks:

- In-memory rate limit state grows per client IP until process restart.
- Worker creates multiple event loops per scheduled job.
- `news_articles` reset destroys data on startup.
- AI fallback failures are printed but not monitored.

## 5. Security Review

The platform is acceptable for a private capstone demo with controlled access codes. It is not ready for open public deployment.

Primary security gaps:

- Public portfolio mutation endpoints.
- Weak role cookie authentication.
- Missing dedicated brute-force protection for login.
- Missing CSRF strategy for state-changing frontend API routes.
- Incomplete `.gitignore` coverage for local secrets and databases.

## 6. Mitigation Roadmap

### Phase 1: Submission Stabilization

1. Remove destructive table dropping from `init_db()` after schema stabilizes.
2. Run `pip install -r backend/requirements.txt` in the active backend environment.
3. Run `python backend/test_ai_provider.py` and capture a successful provider response.
4. Fix frontend lint errors until `npm run lint` passes.
5. Update `.gitignore` to include `.env.local`, `.env.*.local`, `*.db`, `.next/`, and `node_modules/`.

### Phase 2: Security Hardening

1. Add auth enforcement to portfolio endpoints.
2. Replace raw `cs_session=user/admin` with signed sessions.
3. Add login-specific rate limiting.
4. Add CSRF protection for state-changing Next.js routes.
5. Replace raw exception responses with generic API errors.

### Phase 3: AI Reliability

1. Validate AI enrichment output with Pydantic schemas.
2. Log provider name, model name, latency, success/failure, and fallback rate.
3. Add cached enrichment by article link.
4. Add provider failover for OpenRouter/Gemini/OpenAI.
5. Expose AI fields in `/api/news`.

### Phase 4: Architecture Cleanup

1. Split `news_service.py` into focused services.
2. Move prediction scoring constants into configuration.
3. Replace random top-pick sampling with deterministic cached rankings.
4. Introduce Alembic migrations.
5. Add automated backend tests for prediction, news parsing, and AI fallback behavior.

## 7. Final Assessment

Capital Sense is a credible capstone system with a meaningful AI integration story and a working full-stack implementation. The technical direction is strong: Next.js, FastAPI, Neon PostgreSQL, scheduled ingestion, and LiteLLM provider abstraction form a modern architecture.

The final defense should present the system as an open-beta academic prototype, not as a production financial platform. The most important fixes before defense are dependency installation for LiteLLM testing, frontend lint cleanup, `.gitignore` hardening, and replacing the destructive startup database reset.
