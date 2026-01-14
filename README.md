# CAPITAL SENSE 🚀

![Project Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_14_%7C_FastAPI-000000?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> **"Intelligence for the Modern Investor."**

**Capital Sense** is an advanced stock market monitoring and analysis platform tailored for the next generation of investors. By combining real-time market data, Natural Language Processing (NLP) for news sentiment, and a robust 3-Pillar AI Analysis system, Capital Sense provides actionable insights—not just raw numbers.

---

## 🔥 Key Features

### 🤖 Smart AI Prediction (3-Pillar System)
Stop guessing. Our AI evaluates stocks based on three critical dimensions:
1.  **Fundamental (40%)**: Deep dive into Valuation (PER, PBV), Profitability (ROE), and Dividends.
2.  **Technical (30%)**: Automated Trend Analysis (Moving Averages, Cross-overs).
3.  **Sentiment (30%)**: Real-time scoring of market news using NLP (Positive/Negative/Neutral).

### 💼 Portfolio Management
*   **Real-time PnL**: Track your Buy Price vs. Market Price instantly.
*   **Asset Tracking**: Manage your holdings with a clean, intuitive dashboard.
*   **Wealth Summary**: Visualize your total investment and accumulated profit/loss.

### 📰 Intelligent Market Recap
*   **Curated News**: Filtered economic news relevant to your portfolio.
*   **Sentiment Badges**: Quickly identify if a headline is Bullish or Bearish.

### 🔒 Enterprise-Ready Security
*   **Restricted Access**: Private Beta access code system.
*   **Secure Routing**: Middleware-protected dashboard and API routes.

---

## 🛠️ Technology Stack

This project is built with performance and scalability in mind:

### Frontend (Client)
*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: TailwindCSS + Framer Motion (Animations)
*   **Icons**: Lucide React

### Backend (Server)
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database**: SQLite (SQLAlchemy ORM)
*   **Data Sources**: `yfinance` (Yahoo Finance), Google News API
*   **Task Scheduling**: APScheduler (Background Jobs)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   Python 3.10+

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/HisyamAlammar/CAPITAL-SENSE.git
    cd CAPITAL-SENSE
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    pip install -r requirements.txt
    py -m uvicorn main:app --reload
    ```
    *Server runs on `http://localhost:8000`*

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *App runs on `http://localhost:3000`*

---

## ⚠️ Disclaimer

**Capital Sense is currently in OPEN BETA.** 
While we strive for accuracy, stock market predictions are probabilistic. This application provides data-driven insights but does not constitute financial advice. Always do your own research (DYOR).

---

## 👨‍💻 Author

**Hisyam Alammar**
*   [GitHub Profile](https://github.com/HisyamAlammar)
*   Email: abyanhisyamm@gmail.com

---
*© 2026 CAPITAL SENSE. All Rights Reserved.*
