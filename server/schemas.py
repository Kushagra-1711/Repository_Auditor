"""
Pydantic schemas for request validation and response serialization.
"""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Auth Requests ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


# ── Auth Responses ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


# ── Review Schemas ─────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    user_name: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=2000)


class ReviewResponse(BaseModel):
    id: UUID
    user_name: str
    rating: int
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Audit Schemas ──────────────────────────────────────────────────────────

class AuditCreateRequest(BaseModel):
    repository_url: str = Field(
        ...,
        min_length=1,
        max_length=500,
        pattern=r"^https?://github\.com/.+/.+",
        description="Must be a valid GitHub repository URL.",
    )


class AuditResponse(BaseModel):
    id: UUID
    user_id: UUID
    repository_url: str
    repository_name: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Report Schemas ─────────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    id: UUID
    audit_id: UUID
    report_json: Optional[Any] = None
    summary: Optional[str] = None
    security_score: Optional[float] = None
    maintainability_score: Optional[float] = None
    code_quality_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Audit Log Schemas ──────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: UUID
    audit_id: UUID
    event_type: str
    timestamp: datetime

    model_config = {"from_attributes": True}

