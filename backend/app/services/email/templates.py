"""
Email templates for lead qualification notifications.
"""


class QualifiedLeadTemplate:
    """Template for lead qualification notification."""

    @staticmethod
    def plain_text(
        lead_name: str,
        company: str,
        status: str,
        score: float,
        action: str,
    ) -> str:
        """Generate plain text version."""
        return f"""
Lead Qualified

Name: {lead_name}
Company: {company}

Status: {status}
Score: {score}/100

Recommended Action:
{action}

---
LeadFlowAI
""".strip()

    @staticmethod
    def html(
        lead_name: str,
        company: str,
        status: str,
        score: float,
        action: str,
    ) -> str:
        """Generate HTML version."""
        
        # Color code based on status
        status_color = {
            "HOT": "#e74c3c",
            "WARM": "#f39c12",
            "COLD": "#95a5a6",
        }.get(status, "#3498db")

        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 4px; }}
        .content {{ padding: 20px; border: 1px solid #ecf0f1; border-top: none; }}
        .status-badge {{
            display: inline-block;
            background: {status_color};
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
        }}
        .score {{ font-size: 24px; font-weight: bold; color: {status_color}; }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #7f8c8d; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Lead Qualified ✓</h2>
        </div>
        <div class="content">
            <p><strong>Lead Name:</strong> {lead_name}</p>
            <p><strong>Company:</strong> {company}</p>
            
            <hr>
            
            <p><strong>Qualification Status:</strong></p>
            <p><span class="status-badge">{status}</span></p>
            
            <p><strong>Score:</strong></p>
            <p><span class="score">{score}/100</span></p>
            
            <hr>
            
            <p><strong>Recommended Action:</strong></p>
            <p>{action}</p>
            
            <div class="footer">
                <p>LeadFlowAI — Lead Qualification System</p>
            </div>
        </div>
    </div>
</body>
</html>
""".strip()


class FollowUpTemplate:
    """Template for lead follow-up reminder."""

    @staticmethod
    def plain_text(lead_name: str, company: str, days: int = 7) -> str:
        """Generate plain text version."""
        return f"""
Lead Follow-up Reminder

Name: {lead_name}
Company: {company}

It's been {days} days since this lead was qualified.
Time to follow up with a personalized outreach.

---
LeadFlowAI
""".strip()

    @staticmethod
    def html(lead_name: str, company: str, days: int = 7) -> str:
        """Generate HTML version."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #3498db; color: white; padding: 20px; border-radius: 4px; }}
        .content {{ padding: 20px; border: 1px solid #ecf0f1; border-top: none; }}
        .cta-button {{
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
        }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #7f8c8d; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Follow-up Reminder</h2>
        </div>
        <div class="content">
            <p>It's been <strong>{days} days</strong> since <strong>{lead_name}</strong> at <strong>{company}</strong> was qualified.</p>
            
            <p>Time to follow up with personalized outreach!</p>
            
            <p style="text-align: center; margin-top: 20px;">
                <a href="#" class="cta-button">View Lead</a>
            </p>
            
            <div class="footer">
                <p>LeadFlowAI — Lead Qualification System</p>
            </div>
        </div>
    </div>
</body>
</html>
""".strip()
