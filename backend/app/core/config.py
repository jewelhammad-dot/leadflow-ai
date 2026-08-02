from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "LeadFlowAI"
    app_version: str = "1.0.0"
    database_url: str = "postgresql://leadflow:leadflow@localhost:5432/leadflowai"


settings = Settings()