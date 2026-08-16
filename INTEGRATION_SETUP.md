# LeadFlowAI — Integration Setup Guide

This guide covers webhook integration with n8n and email automation setup.

---

## Table of Contents

1. [N8N Webhook Integration](#n8n-webhook-integration)
2. [Email Automation](#email-automation)
3. [Testing](#testing)
4. [Troubleshooting](#troubleshooting)

---

## N8N Webhook Integration

### Overview

After a lead is successfully qualified by the AI system, LeadFlowAI sends an HTTP POST webhook to n8n with the qualification result. This allows you to trigger automated workflows based on lead qualification status.

### Setup Steps

#### 1. Create n8n Webhook Receiver

In your n8n instance:

1. **New Workflow** → Add node → Search for "Webhook"
2. **Select "Webhook Trigger"**
3. **Configure:**
   - Method: `POST`
   - Path: `/webhook/leadflow` (or your preferred path)
   - Response mode: `On Received` or `When Last Node Finishes`
4. **Copy the webhook URL** (looks like: `https://your-n8n-instance.com/webhook/...`)

#### 2. Generate Webhook Secret

The webhook is signed with HMAC-SHA256. Generate a secure secret key:

```bash
openssl rand -hex 32
```

Example output:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### 3. Configure LeadFlowAI

Update `.env` file:

```env
# Enable webhook integration
N8N_WEBHOOK_ENABLED=true

# Your n8n webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/leadflow

# Secret from step 2
N8N_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Webhook timeout (seconds)
N8N_WEBHOOK_TIMEOUT_SECONDS=10
```

### Webhook Payload

When a lead is qualified, LeadFlowAI sends:

```json
{
  "event_type": "lead.qualified",
  "event_timestamp": "2026-08-15T12:34:56.789123",
  "lead_id": 42,
  "lead_name": "Jane Prospect",
  "company": "Acme Corporation",
  "email": "jane@acme.com",
  "qualification_status": "HOT",
  "qualification_score": 87.5,
  "recommended_action": "Schedule a discovery call within 24 hours"
}
```

### HMAC Signature Verification

The webhook request includes an `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=abc123def456...
```

**To verify the signature in n8n:**

1. Add a **Function** node after the webhook
2. Use this code:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify($input.all());
const secret = 'your-webhook-secret';

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

const expected = 'abc123def456...'; // from X-Webhook-Signature header

return signature === expected;
```

Or use n8n's built-in security features if available.

### Example N8N Workflow

```
1. Webhook Trigger
   ↓
2. Extract qualification status
   ↓
3. If status == "HOT":
   - Send Slack notification
   - Create CRM opportunity
   - Send email to sales team
   ↓
4. If status == "WARM":
   - Add to nurture sequence
   ↓
5. If status == "COLD":
   - Archive lead
```

### Error Handling

- **Webhook disabled:** No requests sent
- **URL missing:** No requests sent
- **Secret missing:** No requests sent
- **Timeout (>10s):** Request fails silently, qualification succeeds
- **HTTP error:** Request fails silently, qualification succeeds
- **Network error:** Request fails silently, qualification succeeds

**Important:** Webhook failures do NOT fail the qualification. The API returns success even if the webhook can't be delivered.

---

## Email Automation

### Overview

After qualification, LeadFlowAI can send notification emails. Two providers are supported:
- **SMTP** — For Gmail, custom mail servers, etc.
- **SendGrid** — For high-volume sending

### SMTP Setup

#### 1. Configure SMTP Provider

Update `.env`:

```env
# Enable email
EMAIL_ENABLED=true

# Use SMTP provider
EMAIL_PROVIDER=smtp

# SMTP server details
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com

# For Gmail: Use an App Password, not your regular password
# https://myaccount.google.com/apppasswords
SMTP_PASSWORD=your-app-password

# From address
SMTP_FROM_EMAIL=noreply@leadflowai.com
```

#### 2. Gmail App Password (If Using Gmail)

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the 16-character app password
4. Paste into `SMTP_PASSWORD` in `.env`

#### 3. Test SMTP Connection

```python
import smtplib
from email.mime.text import MIMEText

# Test connection
try:
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your-email@gmail.com', 'app-password')
        print("✅ SMTP connection successful")
except Exception as e:
    print(f"❌ SMTP error: {e}")
```

### SendGrid Setup

#### 1. Create SendGrid Account

1. Go to https://sendgrid.com
2. Sign up and verify your email
3. Create a sender identity or use default

#### 2. Generate API Key

1. In SendGrid dashboard: **Settings** → **API Keys**
2. Create new key with "Mail Send" permissions
3. Copy the key

#### 3. Configure LeadFlowAI

Update `.env`:

```env
# Enable email
EMAIL_ENABLED=true

# Use SendGrid provider
EMAIL_PROVIDER=sendgrid

# SendGrid API key
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# From address (must match SendGrid verified sender)
SMTP_FROM_EMAIL=noreply@leadflowai.com
```

#### 4. Verify Sender

1. In SendGrid: **Sender authentication**
2. Verify your sender email address
3. Use this email in `SMTP_FROM_EMAIL`

### Email Templates

LeadFlowAI includes two templates:

#### Template 1: Qualified Lead Notification

**When sent:** Immediately after qualification  
**Variables:**
- `lead_name`
- `company`
- `qualification_status` (HOT, WARM, COLD)
- `qualification_score` (0-100)
- `recommended_action`

**Example:**
```
Lead Qualified: Jane Prospect (HOT)

Status: HOT
Score: 87.5/100

Recommended Action:
Schedule a discovery call within 24 hours.
```

#### Template 2: Follow-up Reminder

**When sent:** Via separate workflow (not automatic)  
**Variables:**
- `lead_name`
- `company`
- `days` (e.g., 7 days since qualification)

**Example:**
```
Follow-up Reminder

It's been 7 days since Jane Prospect at Acme Corp was qualified.
Time to follow up with personalized outreach!
```

### Error Handling

- **Email disabled:** No emails sent
- **Provider misconfigured:** Silently fails, qualification succeeds
- **SMTP auth fails:** Silently fails, qualification succeeds
- **SendGrid API error:** Silently fails, qualification succeeds
- **Network error:** Silently fails, qualification succeeds
- **Invalid email:** Silently fails, qualification succeeds

**Important:** Email failures do NOT fail the qualification. The API returns success even if the email can't be sent.

### Custom Email Templates

To add custom templates:

1. **Create new template file** in `app/services/email/templates.py`
2. **Implement `plain_text()` and `html()` methods**
3. **Call from `EmailService`**

Example:

```python
class MyCustomTemplate:
    @staticmethod
    def plain_text(variable_1, variable_2):
        return f"Hello {variable_1}, here's {variable_2}"
    
    @staticmethod
    def html(variable_1, variable_2):
        return f"<p>Hello {variable_1}, here's {variable_2}</p>"
```

---

## Testing

### Unit Tests

All webhook and email functionality has unit tests with mocked providers:

```bash
cd backend

# Run all integration tests
python -m pytest tests/test_webhook_service.py -v
python -m pytest tests/test_email_service.py -v
python -m pytest tests/test_qualification_integration.py -v

# Run specific test
python -m pytest tests/test_webhook_service.py::TestWebhookSending::test_successful_delivery -v
```

### Local Testing Without External Services

All tests use mocks — no actual webhooks or emails are sent during testing:

```bash
python -m pytest tests/ -v
```

### Manual Testing

#### Test Webhook Locally

1. **Start a local webhook receiver:**

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        payload = json.loads(body)
        
        print(f"✅ Webhook received: {payload}")
        self.send_response(200)
        self.end_headers()

server = HTTPServer(('localhost', 8000), WebhookHandler)
print("Webhook server listening on :8000")
server.serve_forever()
```

2. **Update .env:**

```env
N8N_WEBHOOK_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:8000/webhook
N8N_WEBHOOK_SECRET=test-secret-123
```

3. **Trigger qualification via API** (see SETUP_GUIDE.md)
4. **Check local server output** for webhook payload

#### Test Email Locally

Use `EMAIL_PROVIDER=smtp` with a test email service:

```bash
# mailtrap.io or similar service offers free test mailbox
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM_EMAIL=test@example.com
```

Or test with print statements:

```python
# Temporarily modify SMTPEmailProvider to print instead of send
# for quick validation during development
```

---

## Troubleshooting

### Webhook Not Received

**Check:**
1. `N8N_WEBHOOK_ENABLED=true` in `.env`
2. `N8N_WEBHOOK_URL` is correct
3. `N8N_WEBHOOK_SECRET` is set
4. n8n instance is running and reachable
5. Firewall allows outbound HTTPS

**Debug:**
- Check application logs for webhook errors
- Verify n8n webhook is active in workflow
- Test connectivity: `curl -X POST https://your-n8n-url/webhook`

### Email Not Sending

**Check:**
1. `EMAIL_ENABLED=true` in `.env`
2. `EMAIL_PROVIDER` is set to `smtp` or `sendgrid`
3. If SMTP:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` are correct
   - SMTP server allows connections (check firewall, port)
   - Gmail: Using App Password, not regular password
4. If SendGrid:
   - API key is valid
   - Sender email is verified

**Debug:**
- Check application logs for email errors
- Test SMTP connection locally:
  ```python
  import smtplib
  smtplib.SMTP('smtp.gmail.com', 587).starttls()
  ```
- Verify SendGrid API key in SendGrid dashboard

### HMAC Signature Mismatch

**If n8n webhook validation fails:**

1. **Verify secret matches** in both LeadFlowAI and n8n
2. **Don't include HTTP headers** when validating signature
3. **Use exact payload JSON** sent in POST body

**Correct signature verification:**
```javascript
crypto
  .createHmac('sha256', 'your-secret')
  .update(rawRequestBody)  // ← Raw JSON body
  .digest('hex')
```

### Timeout Errors

**If webhooks are timing out:**

1. Increase `N8N_WEBHOOK_TIMEOUT_SECONDS` to 30
2. Check n8n workflow performance
3. Optimize n8n workflow for speed
4. Split complex workflows into multiple steps

---

## Security Best Practices

### Webhook Security

- ✅ Use HTTPS only (not HTTP)
- ✅ Never share webhook secret
- ✅ Verify HMAC signature on receiving end
- ✅ Never send passwords or API keys in webhook payload
- ❌ Don't hardcode webhook URL in application code
- ❌ Don't log webhook secrets
- ❌ Don't store secrets in `.env` that gets committed

### Email Security

- ✅ Use SMTP with TLS/SSL
- ✅ Never hardcode SMTP password
- ✅ Use App Passwords for Gmail (not regular password)
- ✅ Verify SendGrid sender domain
- ❌ Don't log email credentials
- ❌ Don't send passwords in email templates
- ❌ Don't expose customer data unnecessarily

### General

- ✅ Keep `.env` file in `.gitignore`
- ✅ Use strong, random secrets
- ✅ Rotate secrets regularly
- ✅ Monitor webhook/email logs
- ✅ Set up alerts for failures

---

## API Reference

### Webhook Service

**Method:** `WebhookService.send_qualification_event()`

```python
WebhookService.send_qualification_event(
    lead_id=1,
    lead_name="Jane Prospect",
    company="Acme Corp",
    email="jane@acme.com",
    qualification_score=87.5,
    qualification_status="HOT",
    recommended_action="Call today",
)
```

**Returns:** `True` if successful, `False` if disabled/failed

### Email Service

**Method:** `EmailService.send_qualification_notification()`

```python
EmailService.send_qualification_notification(
    to_email="jane@acme.com",
    lead_name="Jane Prospect",
    company="Acme Corp",
    status="HOT",
    score=87.5,
    action="Call today",
)
```

**Returns:** `True` if successful, `False` if disabled/failed

**Method:** `EmailService.send_followup_reminder()`

```python
EmailService.send_followup_reminder(
    to_email="jane@acme.com",
    lead_name="Jane Prospect",
    company="Acme Corp",
    days=7,
)
```

**Returns:** `True` if successful, `False` if disabled/failed

---

## Support

For issues or questions:
1. Check this documentation
2. Review test files in `tests/`
3. Check application logs
4. Refer to provider documentation:
   - [n8n Docs](https://docs.n8n.io)
   - [SendGrid Docs](https://docs.sendgrid.com)
   - [Python SMTP Docs](https://docs.python.org/3/library/smtplib.html)

---

**Last Updated:** August 15, 2026  
**LeadFlowAI Version:** 1.0.0
