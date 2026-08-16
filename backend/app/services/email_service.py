"""
Email service layer.

Provides high-level methods for sending notifications.
Handles provider selection and error handling.
"""

import logging
from typing import Optional

from app.core.config import settings
from app.services.email.base import EmailProvider, EmailMessage, EmailError
from app.services.email.smtp_provider import SMTPEmailProvider
from app.services.email.sendgrid_provider import SendGridEmailProvider
from app.services.email.templates import QualifiedLeadTemplate, FollowUpTemplate

logger = logging.getLogger(__name__)


def get_email_provider() -> Optional[EmailProvider]:
    """
    Select and instantiate the configured email provider.
    
    Returns None if email is disabled or provider is misconfigured.
    """

    if not settings.email_enabled:
        return None

    provider_name = (settings.email_provider or "").strip().lower()

    if provider_name == "smtp":
        return SMTPEmailProvider()
    elif provider_name == "sendgrid":
        return SendGridEmailProvider()
    else:
        logger.error(f"Unknown email provider: {provider_name}")
        return None


class EmailService:
    """High-level email sending service."""

    @staticmethod
    def send_qualification_notification(
        to_email: str,
        lead_name: str,
        company: Optional[str],
        status: str,
        score: float,
        action: str,
    ) -> bool:
        """
        Send qualification notification email.
        
        Returns True if sent, False otherwise.
        Does not raise exceptions.
        """

        if not settings.email_enabled:
            logger.debug("Email disabled")
            return False

        provider = get_email_provider()
        if not provider:
            logger.warning("Email provider not available")
            return False

        # Render template
        plain_text = QualifiedLeadTemplate.plain_text(
            lead_name=lead_name,
            company=company or "Unknown",
            status=status,
            score=score,
            action=action,
        )

        html_text = QualifiedLeadTemplate.html(
            lead_name=lead_name,
            company=company or "Unknown",
            status=status,
            score=score,
            action=action,
        )

        # Send
        message = EmailMessage(
            to_email=to_email,
            subject=f"Lead Qualified: {lead_name} ({status})",
            plain_text=plain_text,
            html_text=html_text,
        )

        try:
            return provider.send(message)
        except Exception as exc:
            logger.error(f"Email sending failed: {exc}")
            return False

    @staticmethod
    def send_followup_reminder(
        to_email: str,
        lead_name: str,
        company: Optional[str],
        days: int = 7,
    ) -> bool:
        """
        Send follow-up reminder email.
        
        Returns True if sent, False otherwise.
        Does not raise exceptions.
        """

        if not settings.email_enabled:
            logger.debug("Email disabled")
            return False

        provider = get_email_provider()
        if not provider:
            logger.warning("Email provider not available")
            return False

        # Render template
        plain_text = FollowUpTemplate.plain_text(
            lead_name=lead_name,
            company=company or "Unknown",
            days=days,
        )

        html_text = FollowUpTemplate.html(
            lead_name=lead_name,
            company=company or "Unknown",
            days=days,
        )

        # Send
        message = EmailMessage(
            to_email=to_email,
            subject=f"Follow-up: {lead_name} at {company or 'Unknown'}",
            plain_text=plain_text,
            html_text=html_text,
        )

        try:
            return provider.send(message)
        except Exception as exc:
            logger.error(f"Email sending failed: {exc}")
            return False
