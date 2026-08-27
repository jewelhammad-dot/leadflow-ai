from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.lead_schema import LeadCreate
from app.services.lead_service import LeadService


router = APIRouter(
    prefix="/public",
    tags=["Public Ingest"]
)


class PublicLeadResponse(BaseModel):
    id: int
    name: str
    company: Optional[str] = None
    status: str = "received"
    message: str = "Lead submitted successfully"


@router.post(
    "/leads",
    response_model=PublicLeadResponse,
    status_code=status.HTTP_201_CREATED
)
def ingest_public_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Public lead ingest endpoint allowing external contact forms, landing pages,
    and lead capture widgets to submit leads without requiring JWT authentication.

    Security features:
    - Protects against unauthorized submission via optional X-API-Key header.
    - Does not expose private tenant credentials or user IDs.
    - Validates payload strictly through LeadCreate Pydantic schema.
    - Safely maps lead to the configured default tenant user.
    """
    if not settings.public_ingest_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Public lead ingestion is currently disabled"
        )

    if settings.public_ingest_api_key:
        if not x_api_key or x_api_key != settings.public_ingest_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing API key for public lead ingest"
            )

    # Resolve target tenant user
    target_user = (
        db.query(User)
        .filter(User.id == settings.public_ingest_default_user_id)
        .first()
    )

    if not target_user:
        # Fallback to the first active user in the system
        target_user = (
            db.query(User)
            .filter(User.is_active == True)
            .order_by(User.id.asc())
            .first()
        )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No active tenant available to receive inbound leads"
        )

    created_lead = LeadService.create_lead(
        db=db,
        lead=lead,
        user_id=target_user.id
    )

    return PublicLeadResponse(
        id=created_lead.id,
        name=created_lead.name,
        company=created_lead.company,
        status="received",
        message="Lead submitted successfully"
    )
