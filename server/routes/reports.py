"""
Report routes — retrieve audit reports for authenticated users.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Audit, Report, User
from schemas import ReportResponse
from utils.security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


# ── Get Report by Audit ID ─────────────────────────────────────────────────
@router.get("/{audit_id}", response_model=ReportResponse)
async def get_report(
    audit_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the report associated with an audit, only if the user owns the audit."""

    # Verify audit ownership first
    audit_result = await db.execute(
        select(Audit).where(Audit.id == audit_id, Audit.user_id == current_user.id)
    )
    audit = audit_result.scalar_one_or_none()

    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found.",
        )

    # Fetch the report
    report_result = await db.execute(
        select(Report).where(Report.audit_id == audit_id)
    )
    report = report_result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet available for this audit.",
        )

    return ReportResponse.model_validate(report)
