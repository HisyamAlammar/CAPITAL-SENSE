from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, Portfolio
import yfinance as yf
from typing import List

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models
class PortfolioItem(BaseModel):
    symbol: str
    price: float # Buy Price (Avg)
    lots: int    # Input in Lots

class PortfolioResponse(BaseModel):
    id: int
    symbol: str
    avg_price: float
    total_lots: int
    current_price: float
    total_value: float
    gain_loss_pct: float
    gain_loss_value: float

@router.get("/", response_model=List[PortfolioResponse])
def get_portfolio(db: Session = Depends(get_db)):
    """
    Get all portfolio items with REAL-TIME valuation.
    """
    items = db.query(Portfolio).all()
    results = []
    
    if not items:
        return []

    # Optimize: Fetch all prices in batch or loop? 
    # yfinance is fast enough for small portfolios. Loop is fine for personal use.
    
    for item in items:
        try:
            # Fetch Live Price
            ticker = f"{item.symbol}.JK"
            stock = yf.Ticker(ticker)
             # Try fast fetch first
            current_price = stock.info.get("currentPrice") or stock.info.get("regularMarketPrice") or stock.history(period="1d")["Close"].iloc[-1]
            
            # Calculate Values
            total_shares = item.total_shares
            total_lots = total_shares / 100
            
            # Use stored total_invested if available for better avg price precision, else calc
            invested = item.total_invested or (item.avg_price * total_shares)
            
            current_value = current_price * total_shares
            gain_loss_value = current_value - invested
            gain_loss_pct = (gain_loss_value / invested) * 100 if invested > 0 else 0
            
            results.append({
                "id": item.id,
                "symbol": item.symbol,
                "avg_price": item.avg_price,
                "total_lots": int(total_lots),
                "current_price": current_price,
                "total_value": current_value,
                "gain_loss_pct": gain_loss_pct,
                "gain_loss_value": gain_loss_value
            })
            
        except Exception as e:
            print(f"Error valuaing {item.symbol}: {e}")
            # Return static/last known data if fetch fails
            results.append({
                "id": item.id,
                "symbol": item.symbol,
                "avg_price": item.avg_price,
                "total_lots": int(item.total_shares / 100),
                "current_price": item.avg_price, # Fallback
                "total_value": item.total_invested,
                "gain_loss_pct": 0,
                "gain_loss_value": 0
            })
            
    return results

@router.post("/")
def add_transaction(item: PortfolioItem, db: Session = Depends(get_db)):
    """
    Buy Stock: Updates Average Price if exists, or creates new entry.
    Input: symbol, price (per share), lots
    """
    symbol = item.symbol.upper()
    shares_bought = item.lots * 100
    total_cost = shares_bought * item.price
    
    existing = db.query(Portfolio).filter(Portfolio.symbol == symbol).first()
    
    if existing:
        # Average Down Calculation
        new_total_shares = existing.total_shares + shares_bought
        new_total_invested = existing.total_invested + total_cost
        new_avg_price = new_total_invested / new_total_shares
        
        existing.total_shares = new_total_shares
        existing.total_invested = new_total_invested
        existing.avg_price = new_avg_price
    else:
        # Create New
        new_item = Portfolio(
            symbol=symbol,
            total_shares=shares_bought,
            total_invested=total_cost,
            avg_price=item.price
        )
        db.add(new_item)
    
    db.commit()
    return {"message": "Transaction added successfully"}

@router.delete("/{symbol}")
def delete_asset(symbol: str, db: Session = Depends(get_db)):
    """
    Remove asset from portfolio (Sell All).
    """
    symbol = symbol.upper()
    item = db.query(Portfolio).filter(Portfolio.symbol == symbol).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(item)
    db.commit()
    return {"message": f"{symbol} removed from portfolio"}
