from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.models import lead, user, lead_qualification
from app.api.v1.router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== STARTING DATABASE ===")
    try:
        Base.metadata.create_all(bind=engine)
        print("=== DATABASE OK ===")
    except Exception as exc:
        print(f"=== DATABASE INIT WARNING: {exc} ===")
        print("=== Check that DATABASE_URL environment variable points to a reachable PostgreSQL database ===")
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to LeadFlowAI 🚀"}