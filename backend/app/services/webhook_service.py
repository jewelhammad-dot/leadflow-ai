"""
N8N webhook integration service.

Triggers webhooks to n8n on lead qualification events.
Uses HMAC-SHA256 signing for secure communication.
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class WebhookError(Exception):
    """Raised when webhook delivery fails."""

    pass


class WebhookService:
    """
    Sends lead qualification events to n8n via HTTP POST.
    
    Security:
    - HMAC-SHA256 signature in X-Webhook-Signature header
    - Secret never logged or exposed
    - No JWTs, passwords, or API keys in payload
    """

    @staticmethod
    def _generate_signature(payload: str, secret: str) -> str:
        """Generate HMAC-SHA256 signature for payload."""
        return hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()

    @staticmethod
    def send_qualification_event(
        lead_id: int,
        lead_name: str,
        company: Optional[str],
        email: str,
        qualification_score: float,
        qualification_status: str,
        recommended_action: str,
    ) -> bool:
        """
        Send qualification event to n8n webhook.
        
        Returns True if successful, False if webhook disabled or failed.
        Failures do NOT raise exceptions — webhook is fire-and-forget.
        """

        # Webhook disabled
        if not settings.n8n_webhook_enabled or not settings.n8n_webhook_url:
            logger.debug("Webhook disabled or URL not configured")
            return False

        # Secret required for signed webhooks
        if not settings.n8n_webhook_secret:
            logger.warning("Webhook enabled but secret not configured")
            return False

        payload = {
            "event_type": "lead.qualified",
            "event_timestamp": datetime.utcnow().isoformat(),
            "lead_id": lead_id,
            "lead_name": lead_name,
            "company": company,
            "email": email,
            "qualification_status": qualification_status,
            "qualification_score": qualification_score,
            "recommended_action": recommended_action,
        }

        payload_json = json.dumps(payload)
        signature = WebhookService._generate_signature(
            payload_json, settings.n8n_webhook_secret
        )

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": f"sha256={signature}",
        }

        try:
            response = httpx.post(
                settings.n8n_webhook_url,
                content=payload_json,
                headers=headers,
                timeout=settings.n8n_webhook_timeout_seconds,
            )
            response.raise_for_status()
            logger.info(f"Webhook delivered for lead {lead_id}")
            return True

        except httpx.TimeoutException:
            logger.error(
                f"Webhook timeout for lead {lead_id} "
                f"(timeout: {settings.n8n_webhook_timeout_seconds}s)"
            )
            return False

        except httpx.HTTPStatusError as exc:
            logger.error(
                f"Webhook HTTP error for lead {lead_id}: "
                f"{exc.response.status_code}"
            )
            return False

        except httpx.RequestError as exc:
            logger.error(
                f"Webhook network error for lead {lead_id}: {exc}"
            )
            return False

        except Exception as exc:
            logger.error(f"Unexpected webhook error for lead {lead_id}: {exc}")
            return False
