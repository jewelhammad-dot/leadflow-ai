from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.lead_qualification import LeadQualification
from app.services.lead_service import LeadService
from app.services.ai.provider_factory import get_ai_provider


class QualificationService:

    @staticmethod
    def qualify_lead(db: Session, lead_id: int, user_id: int):
        """
        Runs AI qualification for a lead and persists the result.

        Returns None if the lead does not exist or does not belong to
        user_id (ownership check reuses LeadService's existing, already
        user_id-scoped query — no new ownership logic introduced here).

        Raises AIProviderError (propagated, uncaught) if the AI provider
        fails. No database row is written in that case.
        """
        lead = LeadService.get_lead_by_id(db, lead_id, user_id)

        if not lead:
            return None

        lead_data = {
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "company": lead.company,
            "message": lead.message,
        }

        provider = get_ai_provider()
        result = provider.qualify_lead(lead_data)  # may raise AIProviderError

        qualification = LeadQualification(
            lead_id=lead.id,
            score=result.score,
            classification=result.classification,
            summary=result.summary,
            recommended_action=result.recommended_action,
            ai_provider=settings.ai_provider,
            ai_model=result.model,
        )

        db.add(qualification)
        db.commit()
        db.refresh(qualification)

        return qualification

    @staticmethod
    def get_qualification_history(db: Session, lead_id: int, user_id: int):
        """
        Returns all qualification records for a lead, newest first, so
        the latest result is simply the first list item while prior
        results remain accessible.

        Returns None (distinct from an empty list) if the lead does not
        exist or is not owned by user_id, so the router can 404
        correctly even when a lead has zero qualifications on record.
        """
        lead = LeadService.get_lead_by_id(db, lead_id, user_id)

        if not lead:
            return None

        return (
            db.query(LeadQualification)
            .filter(LeadQualification.lead_id == lead_id)
            # id as a secondary key: created_at (Postgres now()) is scoped to
            # the transaction, so rows inserted in quick succession within
            # the same transaction can share an identical timestamp. id is
            # monotonically increasing regardless, so it reliably breaks ties.
            .order_by(
                LeadQualification.created_at.desc(),
                LeadQualification.id.desc(),
            )
            .all()
        )
