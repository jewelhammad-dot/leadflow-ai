"""
Tests for CORS Configuration and Preflight Handling.
"""

from app.core.config import settings


def test_cors_preflight_allowed_origin(client):
    """Verify CORS preflight OPTIONS request returns correct headers for allowed origin."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "GET" in response.headers.get("access-control-allow-methods", "")


def test_cors_simple_request_allowed_origin(client):
    """Verify CORS headers on actual GET request."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_disallowed_origin_does_not_set_allow_header(client):
    """Verify origin not in cors_origins does not get Access-Control-Allow-Origin."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://malicious-site.example.com"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None


def test_cors_origins_wildcard_property():
    """Verify allowed_cors_origins property parsing."""
    from app.core.config import Settings

    s = Settings(cors_origins="https://leadflow.ai, https://app.leadflow.ai")
    assert s.allowed_cors_origins == ["https://leadflow.ai", "https://app.leadflow.ai"]

    wildcard = Settings(cors_origins="*")
    assert wildcard.allowed_cors_origins == ["*"]
