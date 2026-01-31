from fastapi import APIRouter
import yfinance as yf
import pandas as pd

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

# List of popular Indonesian stocks (Blue Chip / LQ45 subset)
# Expanded list for better Gainers/Losers demo
# List of popular Indonesian stocks (Blue Chip / LQ45 subset)
# Expanded list for better Gainers/Losers demo & Filtering
POPULAR_TICKERS = [
    # Finance
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "ARTO.JK", "BRIS.JK",
    # Tech
    "GOTO.JK", "EMTK.JK", "BUKA.JK", "DCII.JK",
    # Energy & Mining
    "ADRO.JK", "PGAS.JK", "PTBA.JK", "ANTM.JK", "TINS.JK", "INCO.JK", "MEDC.JK",
    # Consumer
    "UNVR.JK", "ICBP.JK", "INDF.JK", "AMRT.JK", "MYOR.JK", "KLBF.JK",
    # Infra & Telco
    "TLKM.JK", "ISAT.JK", "EXCL.JK", "JSMR.JK",
    # Auto & Heavy
    "ASII.JK", "UNTR.JK"
]

# Second Liners / Potential Hidden Gems (Mid-Small Cap)
SMALL_CAP_TICKERS = [
    "CLEO.JK", "MYOH.JK", "WOOD.JK", "MARK.JK", "SIDO.JK", 
    "ERAA.JK", "PANI.JK", "DOID.JK", "HRUM.JK", "GJTL.JK", 
    "AUTO.JK", "DRMA.JK", "MAPA.JK", "ACES.JK", "ELSA.JK"
]

@router.get("/ihsg")
async def get_ihsg_data():
    """
    Get IHSG (Indeks Harga Saham Gabungan) data: current price and history.
    """
    try:
        ihsg = yf.Ticker("^JKSE")
        
        # Get history for chart (3 months is good for general trend)
        hist = ihsg.history(period="3mo")
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": row["Close"]
            })
            
        # Get current info (fallback to last history if info unavailable)
        info = ihsg.info
        current_price = info.get("regularMarketPrice") or hist["Close"].iloc[-1]
        prev_close = info.get("previousClose") or hist["Close"].iloc[-2] if len(hist) > 1 else current_price
        
        change = current_price - prev_close
        change_pct = (change / prev_close) * 100
        
        return {
            "symbol": "IHSG",
            "name": "Indeks Harga Saham Gabungan",
            "price": current_price,
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "history": history_data
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/")
async def get_market_summary():
    """
    Get summary of popular stocks including current price, daily change, market cap, and SECTOR.
    """
    data = []
    tickers_str = " ".join(POPULAR_TICKERS)
    
    try:
        stocks = yf.Tickers(tickers_str)
        
        for ticker in POPULAR_TICKERS:
            # Accessing .info for many tickers via yf.Tickers might be slow or hit/miss in one go
            # But yf.Tickers attempts to batch.
            try:
                info = stocks.tickers[ticker].info
            except:
                continue
                
            if not info: continue
                
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            
            if price and prev_close:
                change = price - prev_close
                change_pct = (change / prev_close) * 100
                
                status = "neutral"
                if change_pct > 0: status = "up"
                elif change_pct < 0: status = "down"
                
                # Normalize Sector
                sector = info.get("sector", "Others")
                # Simplify sector names for simpler filtering if needed
                if "Financial" in sector: sector = "Finance"
                elif "Technology" in sector: sector = "Technology"
                elif "Energy" in sector: sector = "Energy"
                elif "Basic Materials" in sector: sector = "Basic Materials"
                elif "Consumer" in sector: sector = "Consumer"
                elif "Communication" in sector: sector = "Infrastructure"
                elif "Industrials" in sector: sector = "Industrials"
                
                data.append({
                    "symbol": ticker.replace(".JK", ""),
                    "name": info.get("longName", ticker),
                    "price": price,
                    "change": round(change, 2),
                    "change_pct": round(change_pct, 2),
                    "status": status,
                    "volume": info.get("volume", 0),
                    "marketCap": info.get("marketCap", 0),
                    "sector": sector
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
