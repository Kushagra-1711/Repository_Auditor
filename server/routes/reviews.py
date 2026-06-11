"""
Review routes — list and create user reviews.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Review
from schemas import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.get("", response_model=List[ReviewResponse])
async def list_reviews(db: AsyncSession = Depends(get_db)):
    """Return all reviews, newest first."""
    result = await db.execute(
        select(Review).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return [ReviewResponse.model_validate(r) for r in reviews]


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(body: ReviewCreate, db: AsyncSession = Depends(get_db)):
    """Submit a new review."""
    review = Review(
        user_name=body.user_name.strip(),
        rating=body.rating,
        comment=body.comment.strip(),
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewResponse.model_validate(review)
