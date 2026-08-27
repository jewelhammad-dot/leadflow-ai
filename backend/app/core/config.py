from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LeadFlowAI"
    app_version: str = "1.0.0"
    database_url: str = "postgresql://leadflow:leadflow@localhost:5432/leadflowai"

    # --- JWT AUTHENTICATION ---
    secret_key: str = "dev-secret-key-12345678901234567890123456789012"

    # --- AI / Lead Qualification configuration ---
    # All values are environment-driven; nothing here is a real secret.
    ai_provider: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"
    ai_request_timeout_seconds: int = 30

    # --- N8N WEBHOOK INTEGRATION ---
    n8n_webhook_enabled: bool = False
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""
    n8n_webhook_timeout_seconds: int = 10

    # --- EMAIL CONFIGURATION ---
    email_enabled: bool = False
    email_provider: str = "smtp"  # smtp or sendgrid

    # SMTP settings
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    # --- CORS CONFIGURATION ---
    # Comma-separated list of allowed origins or '*' for wildcard
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    @property
    def allowed_cors_origins(self) -> list[str]:
        if not self.cors_origins:
            return ["*"]
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # --- PUBLIC LEAD INGEST ---
    public_ingest_enabled: bool = True
    public_ingest_api_key: str = ""
    public_ingest_default_user_id: int = 1

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()