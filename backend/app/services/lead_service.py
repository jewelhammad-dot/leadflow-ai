from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead_schema import LeadCreate


class LeadService:

    @staticmethod
    def create_lead(db: Session, lead: LeadCreate):
        new_lead = Lead(
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            company=lead.company,
            message=lead.message,
        )

        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        return new_lead

    @staticmethod
    def get_leads(db: Session):
        return db.query(Lead).all()