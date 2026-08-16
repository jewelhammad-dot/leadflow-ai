"""
SendGrid email provider implementation.

Uses SendGrid API for email delivery.
"""

import json
import logging

import httpx

from app.core.config import settings
from app.services.email.base import EmailProvider, EmailMessage, EmailError

logger = logging.getLogger(__name__)

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


class SendGridEmailProvider(EmailProvider):
    """SendGrid API-based email provider."""

    def send(self, message: EmailMessage) -> bool:
        """
        Send email via SendGrid API.
        
        Returns True on success, False on failure.
        Does not raise exceptions.
        """

        # Validate configuration
        if not settings.sendgrid_api_key:
            logger.error("SendGrid API key not configured")
            return False

        payload = {
            "personalizations": [
                {
                    "to": [{"email": message.to_email}],
                    "subject": message.subject,
                }
            ],
            "from": {
                "email": settings.smtp_from_email or "noreply@leadflowai.com"
            },
            "content": [
                {"type": "text/plain", "value": message.plain_text},
                {"type": "text/html", "value": message.html_text},
            ],
        }

        headers = {
            "Authorization": f"Bearer {settings.sendgrid_api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = httpx.post(
                SENDGRID_API_URL,
                headers=headers,
                json=payload,
                timeout=10,
            )

            if response.status_code in (200, 201, 202):
                logger.info(f"Email sent via SendGrid to {message.to_email}")
                return True

            # Log error but don't expose details
            logger.error(
                f"SendGrid API error: {response.status_code}"
            )
            return False

        except httpx.TimeoutException:
            logger.error("SendGrid API timeout")
            return False

        except httpx.RequestError as exc:
            logger.error(f"SendGrid network error: {exc}")
            return False

        except Exception as exc:
            logger.error(f"Unexpected SendGrid error: {exc}")
            return False
