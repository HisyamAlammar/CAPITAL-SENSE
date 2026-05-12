import asyncio
import math

from fastapi import APIRouter
import yfinance as yf


router = APIRouter(prefix="/api/stocks", tags=["stocks"])

POPULAR_TICKERS = [
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "ARTO.JK", "BRIS.JK",
    "GOTO.JK", "EMTK.JK", "BUKA.JK", "DCII.JK",
    "ADRO.JK", "PGAS.JK", "PTBA.JK", "ANTM.JK", "TINS.JK", "INCO.JK", "MEDC.JK",
    "UNVR.JK", "ICBP.JK", "INDF.JK", "AMRT.JK", "MYOR.JK", "KLBF.JK",
    "TLKM.JK", "ISAT.JK", "EXCL.JK", "JSMR.JK",
    "ASII.JK", "UNTR.JK",
]

SMALL_CAP_TICKERS = [
    "CLEO.JK", "MYOH.JK", "WOOD.JK", "MARK.JK", "SIDO.JK",
    "ERAA.JK", "PANI.JK", "DOID.JK", "HRUM.JK", "GJTL.JK",
    "AUTO.JK", "DRMA.JK", "MAPA.JK", "ACES.JK", "ELSA.JK",
]


def sanitize_for_json(data):
    if isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    elif isinstance(data, dict):
        return {k: sanitize_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_for_json(item) for item in data]
    return data


def _safe_int(value, default=0):
    try:
        if value is None:
            return default
        value = float(value)
        if math.isnan(value) or math.isinf(value):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_sector(sector: str):
    sector = sector or "Others"
    if "Financial" in sector:
        return "Finance"
    if "Technology" in sector:
        return "Technology"
    if "Energy" in sector:
        return "Energy"
    if "Basic Materials" in sector:
        return "Basic Materials"
    if "Consumer" in sector:
        return "Consumer"
    if "Communication" in sector:
        return "Infrastructure"
    if "Industrials" in sector:
        return "Industrials"
    return sector


def _fetch_ihsg_data_sync():
    ihsg = yf.Ticker("^JKSE")
    hist = ihsg.history(period="3mo")
    info = ihsg.info

    if hist.empty:
        return {"error": "No IHSG data found"}

    history_data = [
        {
            "date": date.strftime("%Y-%m-%d"),
            "value": float(row["Close"]),
        }
        for date, row in hist.iterrows()
    ]

    current_price = info.get("regularMarketPrice") or float(hist["Close"].iloc[-1])
    prev_close = info.get("previousClose") or (float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price)
    change = current_price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0

    return sanitize_for_json({
        "symbol": "IHSG",
        "name": "Indeks Harga Saham Gabungan",
        "price": current_price,
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "history": history_data,
    })


def _fetch_market_summary_sync():
    data = []
    stocks = yf.Tickers(" ".join(POPULAR_TICKERS))

    for ticker in POPULAR_TICKERS:
        try:
            info = stocks.tickers[ticker].info
        except Exception:
            continue

        if not info:
            continue

        price = info.get("currentPrice") or info.get("regularMarketPrice")
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        if not price or not prev_close:
            continue

        change = price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0

        data.append({
            "symbol": ticker.replace(".JK", ""),
            "name": info.get("longName", ticker),
            "price": price,
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "status": "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral",
            "volume": info.get("volume", 0),
            "marketCap": info.get("marketCap", 0),
            "sector": _normalize_sector(info.get("sector", "Others")),
        })

    data.sort(key=lambda x: x["change_pct"], reverse=True)
    return sanitize_for_json(data)


def _search_stock_sync(query: str):
    ticker_str = f"{query}.JK"
    stock = yf.Ticker(ticker_str)
    info = stock.info

    if not info or not (info.get("currentPrice") or info.get("regularMarketPrice")):
        return []

    price = info.get("currentPrice") or info.get("regularMarketPrice")
    prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
    change = price - prev_close if price and prev_close else 0
    change_pct = (change / prev_close) * 100 if prev_close else 0

    return sanitize_for_json([{
        "symbol": query,
        "name": info.get("longName", query),
        "price": price,
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "status": "up" if change_pct > 0 else "down" if change_pct < 0 else "neutral",
        "marketCap": info.get("marketCap", 0),
        "sector": _normalize_sector(info.get("sector", "Others")),
    }])


def get_holders_data(stock):
    holders = []
    try:
        inst_holders = stock.institutional_holders
        if inst_holders is not None and not inst_holders.empty:
            for _, row in inst_holders.iterrows():
                holders.append({
                    "name": row.get("Holder", "Unknown"),
                    "shares": row.get("Shares", 0),
                    "date": str(row.get("Date Reported", "")),
                    "type": "Institution",
                })

        mf_holders = stock.mutualfund_holders
        if mf_holders is not None and not mf_holders.empty:
            for _, row in mf_holders.iterrows():
                holders.append({
                    "name": row.get("Holder", "Unknown"),
                    "shares": row.get("Shares", 0),
                    "date": str(row.get("Date Reported", "")),
                    "type": "Mutual Fund",
                })

        return holders[:10]
    except Exception:
        return []


def get_robust_shares(stock, info):
    shares = info.get("sharesOutstanding")
    if not shares:
        try:
            shares = stock.fast_info["shares"]
        except Exception:
            shares = None
    return shares


def get_robust_metric(stock, info, key):
    val = info.get(key)

    if val is None and key == "ebitda":
        try:
            stmt = stock.income_stmt
            if not stmt.empty:
                if "EBITDA" in stmt.index:
                    val = stmt.loc["EBITDA"].iloc[0]
                elif "Normalized EBITDA" in stmt.index:
                    val = stmt.loc["Normalized EBITDA"].iloc[0]
                elif "Pretax Income" in stmt.index:
                    pretax = stmt.loc["Pretax Income"].iloc[0]
                    interest = stmt.loc["Interest Expense"].iloc[0] if "Interest Expense" in stmt.index else 0
                    depreciation = stmt.loc["Reconciled Depreciation"].iloc[0] if "Reconciled Depreciation" in stmt.index else 0
                    val = pretax + interest + depreciation
        except Exception:
            pass

    if val is None:
        return None

    currency = info.get("currency")
    financial_currency = info.get("financialCurrency")
    if currency == "IDR" and financial_currency == "USD":
        return val * 16500

    return val


def _fetch_stock_detail_sync(symbol: str):
    ticker = f"{symbol.upper()}.JK"
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1mo")
    info = stock.info

    history_data = [
        {
            "time": date.strftime("%Y-%m-%d"),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": _safe_int(row.get("Volume"), 0),
        }
        for date, row in hist.iterrows()
    ]

    return sanitize_for_json({
        "symbol": symbol.upper(),
        "info": info,
        "history": history_data,
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "pbv_ratio": info.get("priceToBook"),
        "roe": info.get("returnOnEquity"),
        "dividend_yield": info.get("dividendYield"),
        "revenue": info.get("totalRevenue"),
        "net_income": info.get("netIncomeToCommon"),
        "book_value": get_robust_metric(stock, info, "bookValue"),
        "shares_outstanding": get_robust_shares(stock, info),
        "float_shares": info.get("floatShares"),
        "enterprise_value": get_robust_metric(stock, info, "enterpriseValue"),
        "ebitda": get_robust_metric(stock, info, "ebitda"),
        "officers": info.get("companyOfficers", []),
        "website": info.get("website", ""),
        "industry": info.get("industry", "Unknown"),
        "sector": info.get("sector", "Unknown"),
        "description": info.get("longBusinessSummary", "No description available."),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "average_volume": info.get("averageVolume"),
        "beta": info.get("beta"),
        "ipo_date": info.get("firstTradeDateEpochUtc"),
        "share_holders": get_holders_data(stock),
    })


@router.get("/ihsg")
async def get_ihsg_data():
    try:
        return await asyncio.to_thread(_fetch_ihsg_data_sync)
    except Exception as e:
        return {"error": str(e)}


@router.get("/")
async def get_market_summary():
    try:
        return await asyncio.to_thread(_fetch_market_summary_sync)
    except Exception as e:
        return {"error": str(e)}


@router.get("/search")
async def search_stock(q: str):
    if not q:
        return []

    try:
        return await asyncio.to_thread(_search_stock_sync, q.upper())
    except Exception:
        return []


@router.get("/{symbol}")
async def get_stock_detail(symbol: str):
    try:
        return await asyncio.to_thread(_fetch_stock_detail_sync, symbol)
    except Exception as e:
        return {"error": str(e)}
