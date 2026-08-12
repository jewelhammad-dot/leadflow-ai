from datetime import datetime

from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)