from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LeadFlowAI"
    app_version: str = "1.0.0"
    database_url: str = "postgresql://leadflow:leadflow@localhost:5432/leadflowai"

    # --- AI / Lead Qualification configuration ---
    # All values are environment-driven; nothing here is a real secret.
    ai_provider: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"
    ai_request_timeout_seconds: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()