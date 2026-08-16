"""
SMTP email provider implementation.

Uses Python's built-in smtplib for email delivery.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.services.email.base import EmailProvider, EmailMessage, EmailError

logger = logging.getLogger(__name__)


class SMTPEmailProvider(EmailProvider):
    """SMTP-based email provider."""

    def send(self, message: EmailMessage) -> bool:
        """
        Send email via SMTP.
        
        Returns True on success, False on failure.
        Does not raise exceptions.
        """

        # Validate configuration
        if not settings.smtp_host or not settings.smtp_username:
            logger.error("SMTP configuration incomplete")
            return False

        try:
            # Create multipart message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = settings.smtp_from_email or settings.smtp_username
            msg["To"] = message.to_email

            # Attach plain text and HTML versions
            part1 = MIMEText(message.plain_text, "plain")
            part2 = MIMEText(message.html_text, "html")
            msg.attach(part1)
            msg.attach(part2)

            # Connect and send
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(
                    settings.smtp_from_email or settings.smtp_username,
                    message.to_email,
                    msg.as_string(),
                )

            logger.info(f"Email sent to {message.to_email}")
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP authentication failed")
            return False

        except smtplib.SMTPException as exc:
            logger.error(f"SMTP error: {exc}")
            return False

        except OSError as exc:
            logger.error(f"SMTP connection error: {exc}")
            return False

        except Exception as exc:
            logger.error(f"Unexpected email error: {exc}")
            return False
