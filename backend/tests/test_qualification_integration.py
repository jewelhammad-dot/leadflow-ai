"""
Integration tests for qualification with webhook and email.

Verifies that webhook/email failures don't break qualification.
"""

from unittest.mock import patch, MagicMock

import pytest

from app.services.qualification_service import QualificationService


class TestQualificationIntegration:
    """Test qualification flow with webhooks and emails."""

    @patch("app.services.qualification_service.EmailService.send_qualification_notification")
    @patch("app.services.qualification_service.WebhookService.send_qualification_event")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_qualification_calls_webhook(
        self,
        mock_get_ai,
        mock_webhook,
        mock_email,
        db_session,
        test_lead,
    ):
        """Qualification triggers webhook call."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=85.0,
            classification="HOT",
            summary="Good lead",
            recommended_action="Call today",
            model="test-model",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Execute
        qualification = QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Verify webhook was triggered
        assert qualification is not None
        mock_webhook.assert_called_once()

    @patch("app.services.qualification_service.EmailService.send_qualification_notification")
    @patch("app.services.qualification_service.WebhookService.send_qualification_event")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_qualification_calls_email(
        self,
        mock_get_ai,
        mock_webhook,
        mock_email,
        db_session,
        test_lead,
    ):
        """Qualification triggers email call."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=85.0,
            classification="HOT",
            summary="Good lead",
            recommended_action="Call today",
            model="test-model",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Execute
        qualification = QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Verify email was triggered
        assert qualification is not None
        mock_email.assert_called_once()

    @patch("app.services.qualification_service.WebhookService.send_qualification_event")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_webhook_failure_doesnt_fail_qualification(
        self,
        mock_get_ai,
        mock_webhook,
        db_session,
        test_lead,
    ):
        """Webhook failure doesn't cause qualification to fail."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=85.0,
            classification="HOT",
            summary="Good lead",
            recommended_action="Call today",
            model="test-model",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Make webhook fail
        mock_webhook.side_effect = Exception("Webhook failed")
        
        # Execute - should NOT raise exception
        qualification = QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Qualification should still succeed
        assert qualification is not None
        assert qualification.score == 85.0

    @patch("app.services.qualification_service.EmailService.send_qualification_notification")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_email_failure_doesnt_fail_qualification(
        self,
        mock_get_ai,
        mock_email,
        db_session,
        test_lead,
    ):
        """Email failure doesn't cause qualification to fail."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=85.0,
            classification="HOT",
            summary="Good lead",
            recommended_action="Call today",
            model="test-model",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Make email fail
        mock_email.side_effect = Exception("Email failed")
        
        # Execute - should NOT raise exception
        qualification = QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Qualification should still succeed
        assert qualification is not None
        assert qualification.score == 85.0

    @patch("app.services.qualification_service.EmailService.send_qualification_notification")
    @patch("app.services.qualification_service.WebhookService.send_qualification_event")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_webhook_receives_correct_data(
        self,
        mock_get_ai,
        mock_webhook,
        mock_email,
        db_session,
        test_lead,
    ):
        """Webhook receives correct qualification data."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=87.5,
            classification="HOT",
            summary="Strong signal",
            recommended_action="Schedule call",
            model="gpt-4o-mini",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Execute
        QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Check webhook call
        webhook_kwargs = mock_webhook.call_args[1]
        assert webhook_kwargs["lead_id"] == test_lead.id
        assert webhook_kwargs["lead_name"] == test_lead.name
        assert webhook_kwargs["company"] == test_lead.company
        assert webhook_kwargs["email"] == test_lead.email
        assert webhook_kwargs["qualification_score"] == 87.5
        assert webhook_kwargs["qualification_status"] == "HOT"
        assert webhook_kwargs["recommended_action"] == "Schedule call"

    @patch("app.services.qualification_service.EmailService.send_qualification_notification")
    @patch("app.services.qualification_service.WebhookService.send_qualification_event")
    @patch("app.services.qualification_service.get_ai_provider")
    def test_email_receives_correct_data(
        self,
        mock_get_ai,
        mock_webhook,
        mock_email,
        db_session,
        test_lead,
    ):
        """Email receives correct qualification data."""
        # Setup
        from app.services.ai.base import AIQualificationResult
        
        result = AIQualificationResult(
            score=87.5,
            classification="HOT",
            summary="Strong signal",
            recommended_action="Schedule call",
            model="gpt-4o-mini",
        )
        mock_get_ai.return_value.qualify_lead.return_value = result
        
        # Execute
        QualificationService.qualify_lead(db_session, test_lead.id, test_lead.user_id)
        
        # Check email call
        email_kwargs = mock_email.call_args[1]
        assert email_kwargs["to_email"] == test_lead.email
        assert email_kwargs["lead_name"] == test_lead.name
        assert email_kwargs["company"] == test_lead.company
        assert email_kwargs["status"] == "HOT"
        assert email_kwargs["score"] == 87.5
        assert email_kwargs["action"] == "Schedule call"
