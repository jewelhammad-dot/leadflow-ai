"""
Abstract interface for AI lead-qualification providers.

Any concrete provider (OpenRouter, a future direct OpenAI/Anthropic
integration, a local model, etc.) implements `AIProvider` so the rest
of the application never depends on a specific vendor's API shape.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


class AIProviderError(Exception):
    """
    Raised whenever an AI provider cannot produce a usable qualification
    result — network failure, non-2xx response, malformed output, or a
    response that fails validation. Callers should treat this as a
    single, uniform "AI qualification unavailable" signal.
    """


@dataclass(frozen=True)
class AIQualificationResult:
    """Normalized qualification output, independent of provider."""

    score: float                # 0-100, higher = more promising
    classification: str         # "HOT" | "WARM" | "COLD"
    summary: str                # short AI reasoning/explanation
    recommended_action: str     # concrete next step for a sales rep
    model: str                  # the underlying model identifier actually used


class AIProvider(ABC):
    """Interface every lead-qualification AI provider must implement."""

    @abstractmethod
    def qualify_lead(self, lead_data: dict) -> AIQualificationResult:
        """
        Analyze the given lead data and return a qualification result.

        Must raise AIProviderError (not a provider-specific exception)
        on any failure so callers only need to handle one error type.
        """
        raise NotImplementedError
