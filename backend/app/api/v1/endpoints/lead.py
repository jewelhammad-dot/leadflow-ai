from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.lead_schema import LeadCreate, LeadResponse
from app.services.lead_service import LeadService

router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)


@router.post("/", response_model=LeadResponse)
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    return LeadService.create_lead(db, lead)


@router.get("/", response_model=list[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return LeadService.get_leads(db)