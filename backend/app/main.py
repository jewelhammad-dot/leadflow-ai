from fastapi import FastAPI

from app.api.v1.router import router
from app.core.config import settings

from app.core.database import Base, engine
from app.models import lead, user

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to LeadFlowAI 🚀"}