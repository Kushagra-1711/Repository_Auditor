"""
Payment routes — Razorpay order creation and payment verification.
"""
import razorpay
import razorpay.errors
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.database import get_db
from db.models import Payment, User
from schemas import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest
from utils.security import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Plan → amount mapping (in paise)
PLAN_AMOUNTS = {
    "growth": 4900,  # ₹49
}


def _get_razorpay_client() -> razorpay.Client:
    """Return a configured Razorpay client. Raises if keys are missing."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured.",
        )
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ── Create Order ───────────────────────────────────────────────────────────
@router.post("/create-order", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Razorpay order for the selected plan."""

    amount = PLAN_AMOUNTS.get(body.plan)
    if amount is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan '{body.plan}' is not a payable plan.",
        )

    client = _get_razorpay_client()

    order_data = client.order.create({  # type: ignore[attr-defined]
        "amount": amount,
        "currency": "INR",
        "notes": {
            "user_id": str(current_user.id),
            "plan": body.plan,
        },
    })

    # Persist the order in our database
    payment = Payment(
        user_id=current_user.id,
        razorpay_order_id=order_data["id"],
        amount=amount,
        currency="INR",
        status="CREATED",
        plan=body.plan,
    )
    db.add(payment)
    await db.commit()

    return CreateOrderResponse(
        order_id=order_data["id"],
        amount=amount,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
    )


# ── Verify Payment ────────────────────────────────────────────────────────
@router.post("/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify the Razorpay payment signature and update the payment record."""

    client = _get_razorpay_client()

    # Verify signature using Razorpay's utility
    try:
        client.utility.verify_payment_signature({  # type: ignore[attr-defined]
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed.",
        )

    # Update the payment record
    from sqlalchemy import select

    result = await db.execute(
        select(Payment).where(
            Payment.razorpay_order_id == body.razorpay_order_id,
            Payment.user_id == current_user.id,
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    payment.razorpay_payment_id = body.razorpay_payment_id  # type: ignore[assignment]
    payment.status = "PAID"  # type: ignore[assignment]

    await db.commit()

    return {"message": "Payment verified successfully.", "status": "PAID", "plan": payment.plan}
