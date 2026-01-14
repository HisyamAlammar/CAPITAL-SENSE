# CAPITAL SENSE 🚀
> **Intelligent Indonesian Stock Monitoring & Sentiment Analysis Platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)
![Status](https://img.shields.io/badge/Status-Beta-orange)

**Capital Sense** is a modern financial dashboard designed for smart investors. It combines real-time stock data from the Indonesia Stock Exchange (IDX/IHSG) with AI-powered news sentiment analysis to provide actionable market insights.

---

## ✨ Key Features

### 🧠 AI Market Intelligence
- **Smart Sentiment Analysis**: Automatically analyzes news headlines to determine market mood (Bullish/Bearish/Neutral).
- **Daily Market Recap**: Generates a "Mad Libs" style summary of the day's market drivers, highlighting top topics (e.g., "IHSG", "Inflasi") and trending stocks.

### 📊 Interactive Dashboard
- **Real-time Charting**: Switch between professionally styled **Candlestick** and **Line** charts.
- **Fundamental Data**: Instant access to key metrics like **PER, PBV, ROE**, and **Dividend Yield**.
- **Smart Recommendations**: auto-generated "Buy/Hold/Sell" labels based on fundamental health scores.

### 🛡️ Secure & Personalized
- **Watchlist & Price Alerts**: Star your favorite stocks and set price targets. Visual alerts trigger when targets are hit.
- **Restricted Access Mode**: Built-in simple authenticaton middleware for private deployment (protects your personal dashboard).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS + Framer Motion (for smooth animations)
- **Icons**: Lucide React
- **Charts**: Lightweight Charts (TradingView)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Data Source**: `yfinance` & Google News RSS
- **AI/NLP**: 
    - **Production**: TextBlob (Lightweight for Vercel)
    - **Dev/Local**: HuggingFace Transformers (IndoBERT) support available.
- **Database**: SQLite (Local Cache) + SQLAlchemy

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/HisyamAlammar/CAPITAL-SENSE.git
    cd CAPITAL-SENSE
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate
    
    pip install -r requirements.txt
    python main.py
    ```
    *Backend runs on `http://localhost:8000`*

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    
    # Create .env.local
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    echo "NEXT_PUBLIC_ACCESS_CODE=220605" >> .env.local
    
    npm run dev
    ```
    *Frontend runs on `http://localhost:3000`*

---

## 🔒 Access Code
The application is protected by a simple PIN code system. 
Default Access Code: `220605`

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is licensed under the [MIT](LICENSE) license.
