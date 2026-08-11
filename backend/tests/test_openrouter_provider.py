"""
Unit tests for OpenRouterProvider's parsing/validation logic specifically.
No network calls — these exercise _parse_result() and _build_prompt()
directly against synthetic model output, including malformed cases a
real LLM could plausibly return despite the system prompt's instructions.
"""

import pytest

from app.services.ai.base import AIProviderError
from app.services.ai.openrouter_provider import OpenRouterProvider


@pytest.fixture()
def provider(monkeypatch):
    # Bypass the constructor's API-key requirement; these tests only
    # exercise parsing, never make a real request.
    monkeypatch.setattr(
        "app.services.ai.openrouter_provider.settings.openrouter_api_key",
        "test-key",
    )
    return OpenRouterProvider()


def test_parses_clean_json(provider):
    content = (
        '{"score": 72, "classification": "warm", '
        '"summary": "Mid-size company, general inquiry.", '
        '"recommended_action": "Send a follow-up email."}'
    )
    result = provider._parse_result(content)
    assert result.score == 72.0
    assert result.classification == "WARM"  # normalized to uppercase
    assert result.summary == "Mid-size company, general inquiry."


def test_strips_markdown_code_fences(provider):
    content = (
        "```json\n"
        '{"score": 90, "classification": "HOT", '
        '"summary": "Strong signal.", "recommended_action": "Call now."}\n'
        "```"
    )
    result = provider._parse_result(content)
    assert result.score == 90.0
    assert result.classification == "HOT"


def test_clamps_out_of_range_score(provider):
    content = (
        '{"score": 150, "classification": "HOT", '
        '"summary": "x", "recommended_action": "y"}'
    )
    result = provider._parse_result(content)
    assert result.score == 100.0  # clamped, not rejected


def test_rejects_invalid_classification(provider):
    content = (
        '{"score": 50, "classification": "MAYBE", '
        '"summary": "x", "recommended_action": "y"}'
    )
    with pytest.raises(AIProviderError):
        provider._parse_result(content)


def test_rejects_malformed_json(provider):
    with pytest.raises(AIProviderError):
        provider._parse_result("not json at all")


def test_rejects_missing_fields(provider):
    content = '{"score": 50, "classification": "HOT"}'
    with pytest.raises(AIProviderError):
        provider._parse_result(content)


def test_rejects_empty_summary(provider):
    content = (
        '{"score": 50, "classification": "COLD", '
        '"summary": "", "recommended_action": "y"}'
    )
    with pytest.raises(AIProviderError):
        provider._parse_result(content)


def test_build_prompt_handles_missing_fields():
    prompt = OpenRouterProvider._build_prompt(
        {"name": "Jane", "email": None, "phone": None, "company": None, "message": None}
    )
    assert "Jane" in prompt
    assert "Not provided" in prompt
