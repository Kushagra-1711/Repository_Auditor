"""
Audit routes — create and retrieve audits for authenticated users.
"""
from typing import List
from urllib.parse import urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.database import get_db
from db.models import Audit, AuditLog, User
from schemas import AuditCreateRequest, AuditResponse
from utils.security import get_current_user

router = APIRouter(prefix="/api/audits", tags=["Audits"])


def _extract_repo_name(url: str) -> str:
    """Extract 'owner/repo' from a GitHub URL, stripping .git suffix if present."""
    path = urlparse(url).path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]
    return path or url


# ── Create Audit ───────────────────────────────────────────────────────────
@router.post("", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(
    body: AuditCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a new audit request. Sets status to PENDING."""

    audit = Audit(
        user_id=current_user.id,
        repository_url=body.repository_url.strip(),
        repository_name=_extract_repo_name(body.repository_url.strip()),
        status="PENDING",
    )
    db.add(audit)
    await db.flush()

    # Record the creation event in the audit log
    log_entry = AuditLog(
        audit_id=audit.id,
        event_type="AUDIT_CREATED",
    )
    db.add(log_entry)

    await db.commit()
    await db.refresh(audit)

    return AuditResponse.model_validate(audit)


# ── List Audits ────────────────────────────────────────────────────────────
@router.get("", response_model=List[AuditResponse])
async def list_audits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all audits belonging to the authenticated user, newest first."""

    result = await db.execute(
        select(Audit)
        .where(Audit.user_id == current_user.id)
        .order_by(Audit.created_at.desc())
    )
    audits = result.scalars().all()
    return [AuditResponse.model_validate(a) for a in audits]


# ── Get Single Audit ───────────────────────────────────────────────────────
@router.get("/{audit_id}", response_model=AuditResponse)
async def get_audit(
    audit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a specific audit owned by the authenticated user."""

    result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id)
    )
    audit = result.scalar_one_or_none()

    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found.",
        )

    return AuditResponse.model_validate(audit)


@router.post("/{audit_id}/complete")
async def complete_audit(
    audit_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Webhook callback from n8n — marks an audit as COMPLETED.

    Requires a valid ``X-Webhook-Secret`` header to prevent
    unauthenticated callers from manipulating audit state.
    """
    # ── Verify webhook secret ──────────────────────────────────────────
    expected = settings.WEBHOOK_SECRET
    if not expected or request.headers.get("X-Webhook-Secret") != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing webhook secret.",
        )

    result = await db.execute(
        select(Audit).where(Audit.id == audit_id)
    )
    audit = result.scalar_one_or_none()

    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    audit.status = "COMPLETED"  # type: ignore[assignment]

    # Record the completion event
    log_entry = AuditLog(
        audit_id=audit.id,
        event_type="AUDIT_COMPLETED",
    )
    db.add(log_entry)

    await db.commit()
    await db.refresh(audit)

    return {"status": "COMPLETED"}
