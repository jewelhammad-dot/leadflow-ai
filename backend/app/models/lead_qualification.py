from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Index
from sqlalchemy.sql import func

from app.core.database import Base


class LeadQualification(Base):
    """
    One row per AI qualification run for a lead. Kept as its own table
    (rather than columns on `leads`) so history is preserved across
    repeated qualification runs and the Lead model/table stays untouched.
    """

    __tablename__ = "lead_qualifications"

    id = Column(Integer, primary_key=True, index=True)

    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)

    score = Column(Float, nullable=False)
    classification = Column(String, nullable=False)  # HOT / WARM / COLD
    summary = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)

    ai_provider = Column(String, nullable=False)   # e.g. "openrouter"
    ai_model = Column(String, nullable=False)       # e.g. "openai/gpt-4o-mini"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        # Composite index makes "latest qualification for a lead" (ORDER BY
        # created_at DESC LIMIT 1, scoped to lead_id) an index-only lookup
        # rather than a full scan, even as history grows.
        Index("ix_lead_qualifications_lead_id_created_at", "lead_id", "created_at"),
    )
