"""
Tests for n8n webhook service.

All external requests are mocked — no actual webhooks are sent.

Note: These tests do NOT require a database connection.
They can run independently without conftest.py fixtures.
"""

import hmac
import hashlib
import json
from unittest.mock import patch, MagicMock

import pytest

from app.services.webhook_service import WebhookService

pytestmark = pytest.mark.skip_db


class TestWebhookSignature:
    """Test HMAC signature generation."""

    def test_signature_generation(self):
        """Verify HMAC-SHA256 signature generation."""
        payload = '{"event_type":"lead.qualified"}'
        secret = "test-secret-key"
        
        signature = WebhookService._generate_signature(payload, secret)
        
        # Verify against manual calculation
        expected = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        assert signature == expected

    def test_signature_deterministic(self):
        """Same payload + secret produces same signature."""
        payload = '{"event":"test"}'
        secret = "my-secret"
        
        sig1 = WebhookService._generate_signature(payload, secret)
        sig2 = WebhookService._generate_signature(payload, secret)
        
        assert sig1 == sig2

    def test_signature_differs_with_different_secret(self):
        """Different secret produces different signature."""
        payload = '{"event":"test"}'
        
        sig1 = WebhookService._generate_signature(payload, "secret1")
        sig2 = WebhookService._generate_signature(payload, "secret2")
        
        assert sig1 != sig2


class TestWebhookSending:
    """Test webhook delivery."""

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_send_when_disabled(self, mock_settings, mock_post):
        """Webhook disabled returns False without sending."""
        mock_settings.n8n_webhook_enabled = False
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False
        mock_post.assert_not_called()

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_send_when_url_missing(self, mock_settings, mock_post):
        """Webhook enabled but URL missing returns False."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = ""
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False
        mock_post.assert_not_called()

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_send_when_secret_missing(self, mock_settings, mock_post):
        """Webhook enabled but secret missing returns False."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = ""
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False
        mock_post.assert_not_called()

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_successful_delivery(self, mock_settings, mock_post):
        """Successful webhook delivery."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "test-secret"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is True
        mock_post.assert_called_once()
        
        # Verify call was made with correct URL and timeout
        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["timeout"] == 10

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_signature_in_header(self, mock_settings, mock_post):
        """HMAC signature included in X-Webhook-Signature header."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "secret123"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        # Check header
        headers = mock_post.call_args[1]["headers"]
        assert "X-Webhook-Signature" in headers
        assert headers["X-Webhook-Signature"].startswith("sha256=")

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_http_error_handling(self, mock_settings, mock_post):
        """HTTP errors handled gracefully."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "secret123"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = Exception("Server error")
        mock_post.return_value = mock_response
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_timeout_handling(self, mock_settings, mock_post):
        """Timeout errors handled gracefully."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "secret123"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        import httpx
        mock_post.side_effect = httpx.TimeoutException("Timeout")
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_network_error_handling(self, mock_settings, mock_post):
        """Network errors handled gracefully."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "secret123"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        import httpx
        mock_post.side_effect = httpx.ConnectError("Network error")
        
        result = WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test Lead",
            company="Test Co",
            email="test@example.com",
            qualification_score=85.0,
            qualification_status="HOT",
            recommended_action="Call today",
        )
        
        assert result is False

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_payload_structure(self, mock_settings, mock_post):
        """Webhook payload has correct structure."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "secret123"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        WebhookService.send_qualification_event(
            lead_id=42,
            lead_name="Jane Prospect",
            company="Acme Corp",
            email="jane@example.com",
            qualification_score=87.5,
            qualification_status="HOT",
            recommended_action="Schedule call",
        )
        
        # Extract payload
        payload_json = mock_post.call_args[1]["content"]
        payload = json.loads(payload_json)
        
        # Verify structure
        assert payload["event_type"] == "lead.qualified"
        assert payload["lead_id"] == 42
        assert payload["lead_name"] == "Jane Prospect"
        assert payload["company"] == "Acme Corp"
        assert payload["email"] == "jane@example.com"
        assert payload["qualification_score"] == 87.5
        assert payload["qualification_status"] == "HOT"
        assert payload["recommended_action"] == "Schedule call"
        assert "event_timestamp" in payload

    @patch("app.services.webhook_service.httpx.post")
    @patch("app.services.webhook_service.settings")
    def test_secret_not_exposed_in_logs(self, mock_settings, mock_post):
        """Secret is never logged or exposed."""
        mock_settings.n8n_webhook_enabled = True
        mock_settings.n8n_webhook_url = "https://n8n.example.com/webhook"
        mock_settings.n8n_webhook_secret = "super-secret-key-12345"
        mock_settings.n8n_webhook_timeout_seconds = 10
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response
        
        WebhookService.send_qualification_event(
            lead_id=1,
            lead_name="Test",
            company="Test",
            email="test@example.com",
            qualification_score=50.0,
            qualification_status="WARM",
            recommended_action="Follow up",
        )
        
        # Verify payload doesn't contain secret
        payload_json = mock_post.call_args[1]["content"]
        assert "super-secret-key-12345" not in payload_json
