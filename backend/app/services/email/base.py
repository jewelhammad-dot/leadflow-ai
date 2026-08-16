"""
Abstract interface for email providers.

Implementations: SMTP, SendGrid, etc.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


class EmailError(Exception):
    """Raised when email sending fails."""

    pass


@dataclass(frozen=True)
class EmailMessage:
    """Normalized email message."""

    to_email: str
    subject: str
    plain_text: str
    html_text: str


class EmailProvider(ABC):
    """Interface every email provider must implement."""

    @abstractmethod
    def send(self, message: EmailMessage) -> bool:
        """
        Send an email message.
        
        Returns True on success, False on failure.
        Must not raise exceptions.
        """
        raise NotImplementedError
