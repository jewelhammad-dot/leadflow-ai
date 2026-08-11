from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.qualification_schema import QualificationResponse
from app.services.qualification_service import QualificationService
from app.services.ai.base import AIProviderError


router = APIRouter(
    prefix="/leads",
    tags=["AI Qualification"]
)


@router.post("/{lead_id}/qualify", response_model=QualificationResponse)
def qualify_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Runs AI qualification for a lead owned by the authenticated user and
    persists the result. user_id is taken only from the JWT (`sub`
    claim) — never accepted from the client — matching the existing
    Lead CRUD ownership pattern.
    """
    try:
        qualification = QualificationService.qualify_lead(
            db=db,
            lead_id=lead_id,
            user_id=int(current_user["sub"])
        )
    except AIProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI qualification failed: {exc}"
        )

    if not qualification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return qualification


@router.get("/{lead_id}/qualifications", response_model=list[QualificationResponse])
def get_lead_qualifications(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Returns qualification history for a lead, newest first. The latest
    result is history[0]; prior results remain available beneath it.
    """
    history = QualificationService.get_qualification_history(
        db=db,
        lead_id=lead_id,
        user_id=int(current_user["sub"])
    )

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return history
