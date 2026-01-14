from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "sqlite:///./news.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    source = Column(String)
    link = Column(String, unique=True, index=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Sentiment Data
    sentiment_label = Column(String) # POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score = Column(Float)
    
    # Smart Mapping
    # "Global" for general market news
    # "BBCA", "BBRI", etc. for specific stock news
    related_stock = Column(String, default="Global", index=True)

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)
