"""
OpenRouter implementation of AIProvider.

Uses OpenRouter's OpenAI-compatible /chat/completions endpoint directly
via httpx (already a project dependency) rather than a dedicated SDK,
since OpenRouter's API surface is a thin, well-documented REST contract.
"""

import json

import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider, AIProviderError, AIQualificationResult


SYSTEM_PROMPT = (
    "You are a B2B sales lead qualification assistant for a CRM platform. "
    "Given raw lead information, assess how promising the lead is for a "
    "sales team to pursue.\n\n"
    "Respond with STRICT JSON only. No markdown, no code fences, no text "
    "outside the JSON object. The JSON object must have exactly these keys:\n"
    '- "score": a number from 0 to 100 (higher = more promising)\n'
    '- "classification": exactly one of "HOT", "WARM", or "COLD"\n'
    '- "summary": a concise 1-3 sentence explanation of the reasoning\n'
    '- "recommended_action": a short, concrete next action for a sales rep\n\n'
    "If lead information is sparse or missing fields, factor that "
    "uncertainty into a lower score rather than guessing details that "
    "were not provided."
)

VALID_CLASSIFICATIONS = {"HOT", "WARM", "COLD"}


class OpenRouterProvider(AIProvider):

    def __init__(self):
        if not settings.openrouter_api_key:
            raise AIProviderError(
                "OPENROUTER_API_KEY is not configured. Set it as an "
                "environment variable to use the OpenRouter AI provider."
            )

        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
        self.base_url = settings.openrouter_base_url
        self.timeout = settings.ai_request_timeout_seconds

    def qualify_lead(self, lead_data: dict) -> AIQualificationResult:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": self._build_prompt(lead_data)},
            ],
            "temperature": 0.2,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = httpx.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
        except httpx.RequestError as exc:
            raise AIProviderError(f"OpenRouter request failed: {exc}") from exc

        if response.status_code != 200:
            raise AIProviderError(
                f"OpenRouter returned status {response.status_code}: "
                f"{response.text[:300]}"
            )

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            raise AIProviderError(
                f"Unexpected OpenRouter response shape: {exc}"
            ) from exc

        return self._parse_result(content)

    @staticmethod
    def _build_prompt(lead_data: dict) -> str:
        lines = [
            "Lead information:",
            f"- Name: {lead_data.get('name') or 'Not provided'}",
            f"- Email: {lead_data.get('email') or 'Not provided'}",
            f"- Phone: {lead_data.get('phone') or 'Not provided'}",
            f"- Company: {lead_data.get('company') or 'Not provided'}",
            f"- Message/Inquiry: {lead_data.get('message') or 'Not provided'}",
            "",
            "Analyze this lead and return the qualification JSON as specified.",
        ]
        return "\n".join(lines)

    def _parse_result(self, content: str) -> AIQualificationResult:
        cleaned = content.strip()

        # Defensively strip markdown code fences some models add despite instructions.
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise AIProviderError(
                f"AI response was not valid JSON: {exc}"
            ) from exc

        try:
            score = float(parsed["score"])
            classification = str(parsed["classification"]).strip().upper()
            summary = str(parsed["summary"]).strip()
            recommended_action = str(parsed["recommended_action"]).strip()
        except (KeyError, TypeError, ValueError) as exc:
            raise AIProviderError(
                f"AI response missing or invalid fields: {exc}"
            ) from exc

        if classification not in VALID_CLASSIFICATIONS:
            raise AIProviderError(
                f"AI returned an invalid classification: {classification!r}"
            )

        if not summary or not recommended_action:
            raise AIProviderError(
                "AI response had an empty summary or recommended_action"
            )

        score = max(0.0, min(100.0, score))

        return AIQualificationResult(
            score=score,
            classification=classification,
            summary=summary,
            recommended_action=recommended_action,
            model=self.model,
        )
