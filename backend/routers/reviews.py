from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import database
import datetime

router = APIRouter(
    prefix="/api/reviews",
    tags=["reviews"],
)

# Pydantic Models
class ReviewCreate(BaseModel):
    name: str  # User's name or "Anonymous"
    rating: int  # 1-5
    comment: str

class ReviewResponse(ReviewCreate):
    id: int
    created_at: datetime.datetime

    class Config:
        orm_mode = True

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ReviewResponse)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    db_review = database.Review(
        name=review.name,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/", response_model=List[ReviewResponse])
def get_reviews(db: Session = Depends(get_db)):
    return db.query(database.Review).order_by(database.Review.created_at.desc()).all()
