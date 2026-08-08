from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead_schema import LeadCreate, LeadUpdate


class LeadService:

    @staticmethod
    def create_lead(
        db: Session,
        lead: LeadCreate,
        user_id: int
    ):
        new_lead = Lead(
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            company=lead.company,
            message=lead.message,
            user_id=user_id
        )

        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)

        return new_lead

    @staticmethod
    def get_leads(
        db: Session,
        user_id: int
    ):
        return (
            db.query(Lead)
            .filter(Lead.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_lead_by_id(
        db: Session,
        lead_id: int,
        user_id: int
    ):
        return (
            db.query(Lead)
            .filter(
                Lead.id == lead_id,
                Lead.user_id == user_id
            )
            .first()
        )

    @staticmethod
    def update_lead(
        db: Session,
        lead_id: int,
        lead: LeadUpdate,
        user_id: int
    ):
        db_lead = LeadService.get_lead_by_id(
            db,
            lead_id,
            user_id
        )

        if not db_lead:
            return None

        update_data = lead.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(db_lead, key, value)

        db.commit()
        db.refresh(db_lead)

        return db_lead

    @staticmethod
    def delete_lead(
        db: Session,
        lead_id: int,
        user_id: int
    ):
        db_lead = LeadService.get_lead_by_id(
            db,
            lead_id,
            user_id
        )

        if not db_lead:
            return False

        db.delete(db_lead)
        db.commit()

        return True