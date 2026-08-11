from datetime import datetime

from pydantic import BaseModel


class QualificationResponse(BaseModel):
    id: int
    lead_id: int
    score: float
    classification: str
    summary: str
    recommended_action: str
    ai_provider: str
    ai_model: str
    created_at: datetime

    class Config:
        from_attributes = True
