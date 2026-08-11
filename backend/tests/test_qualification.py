"""
Tests for the AI Lead Qualification module.

All AI provider calls are mocked — no real OpenRouter/network calls are
made in this suite. Each test runs in its own rolled-back transaction
(see conftest.py), so tests are independent and leave no data behind.
"""

import app.services.qualification_service as qualification_service_module
from app.services.ai.base import AIQualificationResult, AIProviderError
from app.models.lead_qualification import LeadQualification


class FakeAIProvider:
    """Test double standing in for a real AIProvider."""

    def __init__(self, result=None, error=None):
        self._result = result
        self._error = error

    def qualify_lead(self, lead_data):
        if self._error:
            raise self._error
        return self._result


def _patch_provider(monkeypatch, provider):
    monkeypatch.setattr(
        qualification_service_module, "get_ai_provider", lambda: provider
    )


SAMPLE_RESULT = AIQualificationResult(
    score=87.5,
    classification="HOT",
    summary="Enterprise-sized company with an explicit pricing inquiry.",
    recommended_action="Schedule a discovery call within 24 hours.",
    model="openai/gpt-4o-mini",
)


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def test_qualify_requires_authentication(client, test_lead):
    response = client.post(f"/api/v1/leads/{test_lead.id}/qualify")
    assert response.status_code == 401


def test_qualify_rejects_invalid_token(client, test_lead):
    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Successful qualification
# ---------------------------------------------------------------------------

def test_qualify_lead_success(client, auth_headers, test_lead, monkeypatch):
    _patch_provider(monkeypatch, FakeAIProvider(result=SAMPLE_RESULT))

    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers
    )

    assert response.status_code == 200
    body = response.json()
    assert body["lead_id"] == test_lead.id
    assert body["score"] == 87.5
    assert body["classification"] == "HOT"
    assert body["summary"] == SAMPLE_RESULT.summary
    assert body["recommended_action"] == SAMPLE_RESULT.recommended_action
    assert body["ai_provider"] == "openrouter"
    assert body["ai_model"] == "openai/gpt-4o-mini"
    assert "id" in body and "created_at" in body


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------

def test_qualify_lead_persists_to_database(
    client, db_session, auth_headers, test_lead, monkeypatch
):
    _patch_provider(monkeypatch, FakeAIProvider(result=SAMPLE_RESULT))

    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers
    )
    assert response.status_code == 200
    returned_id = response.json()["id"]

    row = (
        db_session.query(LeadQualification)
        .filter(LeadQualification.id == returned_id)
        .first()
    )
    assert row is not None
    assert row.lead_id == test_lead.id
    assert row.classification == "HOT"
    assert row.score == 87.5
    assert row.ai_provider == "openrouter"


def test_qualification_history_orders_latest_first(
    client, auth_headers, test_lead, monkeypatch
):
    first_result = AIQualificationResult(
        score=40.0, classification="COLD", summary="Early stage.",
        recommended_action="Add to nurture sequence.", model="openai/gpt-4o-mini",
    )
    second_result = SAMPLE_RESULT  # HOT, 87.5

    _patch_provider(monkeypatch, FakeAIProvider(result=first_result))
    client.post(f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers)

    _patch_provider(monkeypatch, FakeAIProvider(result=second_result))
    client.post(f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers)

    response = client.get(
        f"/api/v1/leads/{test_lead.id}/qualifications", headers=auth_headers
    )
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 2
    # Newest first: the second (HOT) call should be history[0].
    assert history[0]["classification"] == "HOT"
    assert history[1]["classification"] == "COLD"


# ---------------------------------------------------------------------------
# Ownership isolation
# ---------------------------------------------------------------------------

def test_qualify_lead_owned_by_another_user_returns_404(
    client, other_auth_headers, test_lead, monkeypatch
):
    _patch_provider(monkeypatch, FakeAIProvider(result=SAMPLE_RESULT))

    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify", headers=other_auth_headers
    )
    assert response.status_code == 404


def test_qualification_history_owned_by_another_user_returns_404(
    client, other_auth_headers, test_lead
):
    response = client.get(
        f"/api/v1/leads/{test_lead.id}/qualifications", headers=other_auth_headers
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Invalid / nonexistent lead
# ---------------------------------------------------------------------------

def test_qualify_nonexistent_lead_returns_404(client, auth_headers, monkeypatch):
    _patch_provider(monkeypatch, FakeAIProvider(result=SAMPLE_RESULT))

    response = client.post("/api/v1/leads/999999/qualify", headers=auth_headers)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# AI provider failure
# ---------------------------------------------------------------------------

def test_qualify_lead_ai_provider_failure_returns_502(
    client, db_session, auth_headers, test_lead, monkeypatch
):
    _patch_provider(
        monkeypatch,
        FakeAIProvider(error=AIProviderError("OpenRouter timed out")),
    )

    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers
    )
    assert response.status_code == 502
    assert "AI qualification failed" in response.json()["detail"]

    # No partial/corrupt row should have been written.
    count = (
        db_session.query(LeadQualification)
        .filter(LeadQualification.lead_id == test_lead.id)
        .count()
    )
    assert count == 0


def test_qualify_lead_missing_api_key_returns_502(
    client, db_session, auth_headers, test_lead, monkeypatch
):
    """Simulates get_ai_provider() itself raising (e.g. no API key configured)."""

    def _raise():
        raise AIProviderError("OPENROUTER_API_KEY is not configured")

    monkeypatch.setattr(qualification_service_module, "get_ai_provider", _raise)

    response = client.post(
        f"/api/v1/leads/{test_lead.id}/qualify", headers=auth_headers
    )
    assert response.status_code == 502

    count = (
        db_session.query(LeadQualification)
        .filter(LeadQualification.lead_id == test_lead.id)
        .count()
    )
    assert count == 0
