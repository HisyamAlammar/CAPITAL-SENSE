from fastapi import APIRouter
import yfinance as yf
import pandas as pd

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

# List of popular Indonesian stocks (Blue Chip / LQ45 subset)
# Expanded list for better Gainers/Losers demo
POPULAR_TICKERS = [
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "TLKM.JK", "ASII.JK",
    "UNVR.JK", "GOTO.JK", "ADRO.JK", "BBNI.JK", "ANTM.JK",
    "ICBP.JK", "KLBF.JK", "PGAS.JK", "PTBA.JK", "UNTR.JK",
    "AMRT.JK", "BUKA.JK", "EMTK.JK", "ARTO.JK", "TINS.JK"
]

@router.get("/")
async def get_market_summary():
    """
    Get summary of popular stocks including current price, daily change, and market cap.
    """
    data = []
    tickers_str = " ".join(POPULAR_TICKERS)
    
    try:
        stocks = yf.Tickers(tickers_str)
        
        for ticker in POPULAR_TICKERS:
            info = stocks.tickers[ticker].info
            if not info: continue
                
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            
            if price and prev_close:
                change = price - prev_close
                change_pct = (change / prev_close) * 100
                
                status = "neutral"
                if change_pct > 0: status = "up"
                elif change_pct < 0: status = "down"
                
                data.append({
                    "symbol": ticker.replace(".JK", ""),
                    "name": info.get("longName", ticker),
                    "price": price,
                    "change": round(change, 2),
                    "change_pct": round(change_pct, 2),
                    "status": status,
                    "volume": info.get("volume", 0),
                    "marketCap": info.get("marketCap", 0)
                })
                
        # Sort by change percentage (descending) by default
        data.sort(key=lambda x: x["change_pct"], reverse=True)
        return data
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/search")
async def search_stock(q: str):
    """
    Search for a stock by symbol. If not in popular list, tries to fetch from yfinance.
    """
    if not q:
        return []

    query = q.upper()
    
    # 1. Search locally first
    local_results = []
    # (Re-using logic from get_market_summary for distinct items would be better refactor, 
    # but for now let's just do a specific fetch if local fails or just return local structure)
    # Actually, we can return a simplified object for search results.
    
    # ... Wait, if we use the existing implementation of get_market_summary to filter, it's heavy.
    # Let's just return what we find.

    # 2. If valid symbol format (3-4 letters), try to fetch directly
    try:
        ticker_str = f"{query}.JK"
        stock = yf.Ticker(ticker_str)
        info = stock.info
        
        # Check if valid (has price or name)
        if info and (info.get("currentPrice") or info.get("regularMarketPrice")):
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            change = price - prev_close if price and prev_close else 0
            change_pct = (change / prev_close) * 100 if prev_close else 0
            
            return [{
                "symbol": query,
                "name": info.get("longName", query),
                "price": price,
                "change": round(change, 2),
                "change_pct": round(change_pct, 2),
                "status": "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral",
                "marketCap": info.get("marketCap", 0)
            }]
            
    except Exception:
        pass
        
    return []

@router.get("/{symbol}")
async def get_stock_detail(symbol: str):
    """
    Get detailed data including officers (management) and holders.
    """
    try:
        ticker = f"{symbol.upper()}.JK"
        stock = yf.Ticker(ticker)
        
        # Get 1 month history
        hist = stock.history(period="1mo")
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "time": date.strftime("%Y-%m-%d"), # lightweight-charts prefers 'time'
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": row["Volume"]
            })
            
        return {
            "symbol": symbol.upper(),
            "info": stock.info,
            "history": history_data,
            # Fundamentals
            "market_cap": stock.info.get("marketCap"),
            "pe_ratio": stock.info.get("trailingPE"),
            "pbv_ratio": stock.info.get("priceToBook"),
            "roe": stock.info.get("returnOnEquity"),
            "dividend_yield": stock.info.get("dividendYield"),
            "revenue": stock.info.get("totalRevenue"),
            "net_income": stock.info.get("netIncomeToCommon"),
            
            # Gen Z "Trusted Check": Who runs this company?
            "officers": stock.info.get("companyOfficers", []),
            "website": stock.info.get("website", ""),
            "industry": stock.info.get("industry", "Unknown"),
            "sector": stock.info.get("sector", "Unknown"),
            "description": stock.info.get("longBusinessSummary", "No description available.")
        }
    except Exception as e:
        return {"error": str(e)}
