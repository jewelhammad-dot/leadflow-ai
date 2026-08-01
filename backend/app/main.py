from fastapi import FastAPI
from app.api.v1.router import router

app = FastAPI(title="LeadFlowAI")

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to LeadFlowAI 🚀"}