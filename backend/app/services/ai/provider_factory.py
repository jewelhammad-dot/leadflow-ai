"""
Selects and constructs the configured AI provider.

This is the single place that knows which concrete AIProvider class
backs `AI_PROVIDER`. Swapping providers later means adding a branch
here (and a new provider module) — nothing else in the codebase
needs to change.
"""

from app.core.config import settings
from app.services.ai.base import AIProvider, AIProviderError
from app.services.ai.openrouter_provider import OpenRouterProvider


def get_ai_provider() -> AIProvider:
    provider_name = (settings.ai_provider or "").strip().lower()

    if provider_name == "openrouter":
        return OpenRouterProvider()

    raise AIProviderError(
        f"Unsupported AI_PROVIDER configured: {provider_name!r}. "
        "Supported providers: 'openrouter'."
    )
