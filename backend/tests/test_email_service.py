"""
Tests for email service and providers.

All external services are mocked — no actual emails are sent.
"""

from unittest.mock import patch, MagicMock
import smtplib

import pytest

from app.services.email_service import EmailService, get_email_provider
from app.services.email.base import EmailMessage
from app.services.email.smtp_provider import SMTPEmailProvider
from app.services.email.sendgrid_provider import SendGridEmailProvider


class TestEmailProviderFactory:
    """Test email provider selection."""

    @patch("app.services.email_service.settings")
    def test_disabled_returns_none(self, mock_settings):
        """Email disabled returns None."""
        mock_settings.email_enabled = False
        
        provider = get_email_provider()
        
        assert provider is None

    @patch("app.services.email_service.settings")
    def test_smtp_provider_selected(self, mock_settings):
        """SMTP provider selected when configured."""
        mock_settings.email_enabled = True
        mock_settings.email_provider = "smtp"
        
        provider = get_email_provider()
        
        assert isinstance(provider, SMTPEmailProvider)

    @patch("app.services.email_service.settings")
    def test_sendgrid_provider_selected(self, mock_settings):
        """SendGrid provider selected when configured."""
        mock_settings.email_enabled = True
        mock_settings.email_provider = "sendgrid"
        
        provider = get_email_provider()
        
        assert isinstance(provider, SendGridEmailProvider)

    @patch("app.services.email_service.settings")
    def test_unknown_provider_returns_none(self, mock_settings):
        """Unknown provider returns None."""
        mock_settings.email_enabled = True
        mock_settings.email_provider = "unknown_provider"
        
        provider = get_email_provider()
        
        assert provider is None


class TestSMTPProvider:
    """Test SMTP email provider."""

    @patch("app.services.email.smtp_provider.smtplib.SMTP")
    @patch("app.services.email.smtp_provider.settings")
    def test_successful_send(self, mock_settings, mock_smtp_class):
        """SMTP provider sends email successfully."""
        mock_settings.smtp_host = "smtp.example.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@example.com"
        mock_settings.smtp_password = "password"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_smtp = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_smtp
        
        provider = SMTPEmailProvider()
        message = EmailMessage(
            to_email="recipient@example.com",
            subject="Test",
            plain_text="Test body",
            html_text="<p>Test body</p>",
        )
        
        result = provider.send(message)
        
        assert result is True
        mock_smtp.starttls.assert_called_once()
        mock_smtp.login.assert_called_once()
        mock_smtp.sendmail.assert_called_once()

    @patch("app.services.email.smtp_provider.settings")
    def test_missing_config_returns_false(self, mock_settings):
        """Missing SMTP config returns False."""
        mock_settings.smtp_host = ""
        mock_settings.smtp_username = ""
        
        provider = SMTPEmailProvider()
        message = EmailMessage(
            to_email="test@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        result = provider.send(message)
        
        assert result is False

    @patch("app.services.email.smtp_provider.smtplib.SMTP")
    @patch("app.services.email.smtp_provider.settings")
    def test_auth_error_returns_false(self, mock_settings, mock_smtp_class):
        """Authentication error returns False."""
        mock_settings.smtp_host = "smtp.example.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@example.com"
        mock_settings.smtp_password = "wrong"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_smtp = MagicMock()
        mock_smtp.login.side_effect = smtplib.SMTPAuthenticationError(
            535, "Authentication failed"
        )
        mock_smtp_class.return_value.__enter__.return_value = mock_smtp
        
        provider = SMTPEmailProvider()
        message = EmailMessage(
            to_email="recipient@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        result = provider.send(message)
        
        assert result is False

    @patch("app.services.email.smtp_provider.smtplib.SMTP")
    @patch("app.services.email.smtp_provider.settings")
    def test_connection_error_returns_false(self, mock_settings, mock_smtp_class):
        """Connection error returns False."""
        mock_settings.smtp_host = "invalid.example.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user"
        mock_settings.smtp_password = "pass"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_smtp_class.return_value.__enter__.side_effect = OSError("Connection failed")
        
        provider = SMTPEmailProvider()
        message = EmailMessage(
            to_email="recipient@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        result = provider.send(message)
        
        assert result is False


class TestSendGridProvider:
    """Test SendGrid email provider."""

    @patch("app.services.email.sendgrid_provider.httpx.post")
    @patch("app.services.email.sendgrid_provider.settings")
    def test_successful_send(self, mock_settings, mock_post):
        """SendGrid provider sends email successfully."""
        mock_settings.sendgrid_api_key = "sg-test-key"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_post.return_value = mock_response
        
        provider = SendGridEmailProvider()
        message = EmailMessage(
            to_email="recipient@example.com",
            subject="Test",
            plain_text="Test body",
            html_text="<p>Test body</p>",
        )
        
        result = provider.send(message)
        
        assert result is True
        mock_post.assert_called_once()

    @patch("app.services.email.sendgrid_provider.settings")
    def test_missing_api_key_returns_false(self, mock_settings):
        """Missing API key returns False."""
        mock_settings.sendgrid_api_key = ""
        
        provider = SendGridEmailProvider()
        message = EmailMessage(
            to_email="test@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        result = provider.send(message)
        
        assert result is False

    @patch("app.services.email.sendgrid_provider.httpx.post")
    @patch("app.services.email.sendgrid_provider.settings")
    def test_api_error_returns_false(self, mock_settings, mock_post):
        """API error returns False."""
        mock_settings.sendgrid_api_key = "sg-test-key"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_post.return_value = mock_response
        
        provider = SendGridEmailProvider()
        message = EmailMessage(
            to_email="recipient@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        result = provider.send(message)
        
        assert result is False

    @patch("app.services.email.sendgrid_provider.httpx.post")
    @patch("app.services.email.sendgrid_provider.settings")
    def test_authorization_header(self, mock_settings, mock_post):
        """Bearer token in Authorization header."""
        mock_settings.sendgrid_api_key = "sg-secret-key-123"
        mock_settings.smtp_from_email = "noreply@example.com"
        
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_post.return_value = mock_response
        
        provider = SendGridEmailProvider()
        message = EmailMessage(
            to_email="test@example.com",
            subject="Test",
            plain_text="Test",
            html_text="<p>Test</p>",
        )
        
        provider.send(message)
        
        headers = mock_post.call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer sg-secret-key-123"


class TestEmailService:
    """Test high-level email service."""

    @patch("app.services.email_service.settings")
    def test_disabled_returns_false(self, mock_settings):
        """Disabled email service returns False."""
        mock_settings.email_enabled = False
        
        result = EmailService.send_qualification_notification(
            to_email="test@example.com",
            lead_name="Test Lead",
            company="Test Co",
            status="HOT",
            score=85.0,
            action="Call today",
        )
        
        assert result is False

    @patch("app.services.email_service.get_email_provider")
    @patch("app.services.email_service.settings")
    def test_qualification_notification_sends(self, mock_settings, mock_provider_getter):
        """Qualification notification sends successfully."""
        mock_settings.email_enabled = True
        
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        mock_provider_getter.return_value = mock_provider
        
        result = EmailService.send_qualification_notification(
            to_email="test@example.com",
            lead_name="Jane Prospect",
            company="Acme Corp",
            status="HOT",
            score=87.5,
            action="Schedule call",
        )
        
        assert result is True
        mock_provider.send.assert_called_once()

    @patch("app.services.email_service.get_email_provider")
    @patch("app.services.email_service.settings")
    def test_qualification_template_variables(self, mock_settings, mock_provider_getter):
        """Template variables correctly substituted."""
        mock_settings.email_enabled = True
        
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        mock_provider_getter.return_value = mock_provider
        
        EmailService.send_qualification_notification(
            to_email="test@example.com",
            lead_name="Jane Prospect",
            company="Acme Corp",
            status="HOT",
            score=87.5,
            action="Schedule call",
        )
        
        # Check message passed to provider
        message = mock_provider.send.call_args[0][0]
        assert message.to_email == "test@example.com"
        assert "Jane Prospect" in message.plain_text
        assert "Acme Corp" in message.plain_text
        assert "HOT" in message.plain_text
        assert "87.5" in message.plain_text
        assert "Schedule call" in message.plain_text

    @patch("app.services.email_service.get_email_provider")
    @patch("app.services.email_service.settings")
    def test_followup_reminder_sends(self, mock_settings, mock_provider_getter):
        """Follow-up reminder sends successfully."""
        mock_settings.email_enabled = True
        
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        mock_provider_getter.return_value = mock_provider
        
        result = EmailService.send_followup_reminder(
            to_email="test@example.com",
            lead_name="Jane Prospect",
            company="Acme Corp",
            days=7,
        )
        
        assert result is True
        mock_provider.send.assert_called_once()

    @patch("app.services.email_service.get_email_provider")
    @patch("app.services.email_service.settings")
    def test_credentials_not_logged(self, mock_settings, mock_provider_getter):
        """Credentials never appear in messages."""
        mock_settings.email_enabled = True
        mock_settings.smtp_password = "super-secret-password-123"
        
        mock_provider = MagicMock()
        mock_provider.send.return_value = True
        mock_provider_getter.return_value = mock_provider
        
        EmailService.send_qualification_notification(
            to_email="test@example.com",
            lead_name="Test",
            company="Test",
            status="HOT",
            score=50.0,
            action="Follow up",
        )
        
        # Check message doesn't contain password
        message = mock_provider.send.call_args[0][0]
        assert "super-secret-password-123" not in message.plain_text
        assert "super-secret-password-123" not in message.html_text
