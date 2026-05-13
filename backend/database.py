import datetime
import os
from pathlib import Path

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _load_env_file() -> None:
    project_root = Path(__file__).resolve().parent.parent
    env_file = project_root / ".env"
    if not env_file.exists():
        env_file = Path(__file__).resolve().parent / ".env"
    if not env_file.exists():
        return

    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required for Neon PostgreSQL.")

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=300,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class NewsArticle(Base):
    __tablename__ = "news_articles"
    __table_args__ = (
        Index("ix_news_related_stock_published_at", "related_stock", "published_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    summary = Column(Text, nullable=True)
    source = Column(String)
    link = Column(String, unique=True, index=True)
    published_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    sentiment_label = Column(String)
    sentiment_score = Column(Float)
    event_type = Column(String, nullable=True)
    market_impact = Column(String, nullable=True)
    ai_rationale = Column(Text, nullable=True)
    related_stock = Column(String, default="Global", index=True)


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    avg_price = Column(Float)
    total_shares = Column(Integer)
    total_invested = Column(Float, default=0.0)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


def init_db():
    Base.metadata.create_all(bind=engine)
