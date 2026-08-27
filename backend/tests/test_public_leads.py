"""
Tests for Public Lead Ingestion Endpoint (/api/v1/public/leads).
"""

from app.core.config import settings
from app.models.lead import Lead


def test_public_lead_creation_success(client, test_user, db_session, monkeypatch):
    """Verify an external landing page can submit a lead and receive a 201 response."""
    monkeypatch.setattr(settings, "public_ingest_default_user_id", test_user.id)
    payload = {
        "name": "Sarah Connor",
        "email": "sarah@cyberdyne.com",
        "phone": "+1 555-987-6543",
        "company": "Cyberdyne Systems",
        "message": "Interested in enterprise AI qualification pipeline."
    }

    response = client.post("/api/v1/public/leads", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "Sarah Connor"
    assert data["company"] == "Cyberdyne Systems"
    assert data["status"] == "received"
    assert "user_id" not in data  # Ensure tenant user ID is not leaked

    # Verify persisted in database
    persisted = db_session.query(Lead).filter(Lead.id == data["id"]).first()
    assert persisted is not None
    assert persisted.name == "Sarah Connor"
    assert persisted.email == "sarah@cyberdyne.com"
    assert persisted.user_id == test_user.id


def test_public_lead_creation_minimal_fields(client, test_user, db_session, monkeypatch):
    """Verify lead can be created with only the required name field."""
    monkeypatch.setattr(settings, "public_ingest_default_user_id", test_user.id)
    payload = {"name": "Anonymous Inquirer"}
    response = client.post("/api/v1/public/leads", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Anonymous Inquirer"
    assert data["company"] is None


def test_public_lead_validation_missing_name(client):
    """Verify validation error (422) if name is missing."""
    payload = {
        "email": "noname@example.com",
        "message": "Missing name"
    }
    response = client.post("/api/v1/public/leads", json=payload)
    assert response.status_code == 422


def test_public_lead_disabled(client, monkeypatch):
    """Verify 503 error when public ingest is disabled via config."""
    monkeypatch.setattr(settings, "public_ingest_enabled", False)
    payload = {"name": "Test Prospect"}
    response = client.post("/api/v1/public/leads", json=payload)
    assert response.status_code == 503
    assert "disabled" in response.json()["detail"].lower()


def test_public_lead_api_key_required_and_missing(client, monkeypatch):
    """Verify 401 Unauthorized when API key is configured but not provided."""
    monkeypatch.setattr(settings, "public_ingest_api_key", "secret-key-123")
    payload = {"name": "Test Prospect"}
    response = client.post("/api/v1/public/leads", json=payload)
    assert response.status_code == 401
    assert "API key" in response.json()["detail"]


def test_public_lead_api_key_invalid(client, monkeypatch):
    """Verify 401 Unauthorized when provided API key does not match."""
    monkeypatch.setattr(settings, "public_ingest_api_key", "secret-key-123")
    payload = {"name": "Test Prospect"}
    response = client.post(
        "/api/v1/public/leads",
        json=payload,
        headers={"X-API-Key": "wrong-key"}
    )
    assert response.status_code == 401


def test_public_lead_api_key_valid(client, test_user, monkeypatch):
    """Verify 201 Created when valid API key is supplied."""
    monkeypatch.setattr(settings, "public_ingest_api_key", "secret-key-123")
    monkeypatch.setattr(settings, "public_ingest_default_user_id", test_user.id)
    payload = {"name": "VIP Prospect", "company": "Innovate LLC"}
    response = client.post(
        "/api/v1/public/leads",
        json=payload,
        headers={"X-API-Key": "secret-key-123"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "VIP Prospect"


def test_public_routes_do_not_expose_private_leads(client):
    """Verify private authenticated routes cannot be accessed without JWT."""
    # Attempting to GET /api/v1/leads without token
    get_resp = client.get("/api/v1/leads/")
    assert get_resp.status_code == 401

    # Attempting to GET /api/v1/public/leads should be 405 Method Not Allowed (only POST is exposed)
    public_get = client.get("/api/v1/public/leads")
    assert public_get.status_code == 405
