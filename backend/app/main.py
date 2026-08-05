from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import lead, user


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== STARTING DATABASE ===")
    Base.metadata.create_all(bind=engine)
    print("=== DATABASE OK ===")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to LeadFlowAI 🚀"}