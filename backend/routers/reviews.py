import datetime
import os
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, constr
from sqlalchemy.orm import Session

import database


router = APIRouter(
    prefix="/api/reviews",
    tags=["reviews"],
)


class ReviewCreate(BaseModel):
    name: constr(strip_whitespace=True, max_length=80) = "Anonymous"
    rating: int = Field(ge=1, le=5)
    comment: constr(strip_whitespace=True, min_length=3, max_length=1000)


class ReviewResponse(ReviewCreate):
    id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_admin(x_admin_token: str | None = Header(default=None)):
    expected = os.getenv("ADMIN_API_TOKEN")
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/", response_model=ReviewResponse)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = database.Review(
        name=review.name or "Anonymous",
        rating=review.rating,
        comment=review.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


@router.get("/", response_model=List[ReviewResponse], dependencies=[Depends(require_admin)])
def get_reviews(db: Session = Depends(get_db)):
    return db.query(database.Review).order_by(database.Review.created_at.desc()).limit(200).all()
