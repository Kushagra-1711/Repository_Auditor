"""
Contact routes — receive "Leave us your query" submissions via email.
"""
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from utils.email import send_contact_email

router = APIRouter(prefix="/api/contact", tags=["Contact"])
limiter = Limiter(key_func=get_remote_address)


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def submit_contact(request: Request, body: ContactRequest):
    """Receive a contact form submission and forward it via email."""
    try:
        send_contact_email(
            from_name=body.name.strip(),
            from_email=body.email,
            subject=body.subject.strip(),
            message=body.message.strip(),
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send your message. Please try again later.",
        )

    return {"message": "Your message has been sent. We'll get back to you shortly!"}
