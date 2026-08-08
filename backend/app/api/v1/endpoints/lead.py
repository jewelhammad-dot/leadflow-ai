from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.lead_schema import LeadCreate, LeadUpdate, LeadResponse
from app.services.lead_service import LeadService


router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)


@router.post("/", response_model=LeadResponse)
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return LeadService.create_lead(
        db=db,
        lead=lead,
        user_id=int(current_user["sub"])
    )


@router.get("/", response_model=list[LeadResponse])
def get_leads(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return LeadService.get_leads(
        db=db,
        user_id=int(current_user["sub"])
    )


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead_by_id(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    lead = LeadService.get_lead_by_id(
        db=db,
        lead_id=lead_id,
        user_id=int(current_user["sub"])
    )

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead: LeadUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    updated = LeadService.update_lead(
        db=db,
        lead_id=lead_id,
        lead=lead,
        user_id=int(current_user["sub"])
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return updated


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    deleted = LeadService.delete_lead(
        db=db,
        lead_id=lead_id,
        user_id=int(current_user["sub"])
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )

    return {"message": "Lead deleted successfully"}