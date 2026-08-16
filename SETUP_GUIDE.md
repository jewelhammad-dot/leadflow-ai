# LeadFlowAI Backend — Setup & Deployment Guide

This guide covers local development setup, testing, and production deployment of the LeadFlowAI backend.

## Prerequisites

- **Docker & Docker Compose** (local development)
- **Python 3.12+** (local development without Docker)
- **Git** (already cloned)

---

## Local Development Setup

### 1. Clone & Branch Checkout

```bash
git clone https://github.com/jewelhammad-dot/leadflow-ai.git
cd leadflow-ai
git checkout feature/lead-crud
```

### 2. Configure Environment

Copy the example configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Local PostgreSQL (docker-compose):
DATABASE_URL=postgresql://leadflow:leadflow@localhost:5432/leadflowai

# Generate with: openssl rand -hex 32
SECRET_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Optional: OpenRouter AI provider
OPENROUTER_API_KEY=sk-or-...

# Environment
ENVIRONMENT=development
```

### 3. Start PostgreSQL

```bash
docker-compose up -d
```

Verify it's running:

```bash
docker-compose ps
```

You should see `leadflow-postgres` with status `Up`.

### 4. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt

# If you get system package warnings:
pip install --break-system-packages -r requirements.txt
```

### 5. Initialize Database Schema

```bash
# Check migration status:
python -m alembic heads
python -m alembic current

# Apply migrations (creates tables):
python -m alembic upgrade head

# Verify schema was created:
psql -U leadflow -d leadflowai -c "\dt"
```

### 6. Run Tests

```bash
# Syntax check:
python -m compileall app tests

# Run all tests with pytest:
python -m pytest -v

# Run specific test file:
python -m pytest tests/test_qualification.py -v

# Run with coverage:
python -m pytest --cov=app tests/
```

Expected output:
```
======================== X passed in Y.XXs =========================
```

### 7. Start Development Server

```bash
# Option A: Direct uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option B: Using python -m
python -m uvicorn app.main:app --reload

# Option C: Using docker-compose (future enhancement)
docker-compose up  # (add backend service to docker-compose.yml)
```

The API will be available at: `http://localhost:8000`

---

## Testing the API Manually

### Health Check

```bash
curl http://localhost:8000/api/v1/health
# Response: {"status":"OK"}
```

### Register a User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Prospect",
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'

# Response:
# {
#   "id": 1,
#   "name": "Jane Prospect",
#   "email": "jane@example.com",
#   "is_active": true
# }
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=jane@example.com&password=SecurePass123"

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer"
# }

# Save the token for next requests
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create a Lead

```bash
curl -X POST http://localhost:8000/api/v1/leads/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp Prospect",
    "email": "contact@acme.com",
    "phone": "555-1234",
    "company": "Acme Corporation",
    "message": "Interested in enterprise plan"
  }'

# Response: { "id": 1, "name": "Acme Corp Prospect", ... }
```

### Get All Leads

```bash
curl http://localhost:8000/api/v1/leads/ \
  -H "Authorization: Bearer $TOKEN"

# Response: [{ "id": 1, "name": "Acme Corp Prospect", ... }]
```

### Qualify a Lead (Requires OpenRouter API Key)

```bash
curl -X POST http://localhost:8000/api/v1/leads/1/qualify \
  -H "Authorization: Bearer $TOKEN"

# If OPENROUTER_API_KEY is set:
# Response: {
#   "id": 1,
#   "lead_id": 1,
#   "score": 87.5,
#   "classification": "HOT",
#   "summary": "Enterprise-sized company with explicit inquiry",
#   "recommended_action": "Schedule discovery call",
#   "ai_provider": "openrouter",
#   "ai_model": "openai/gpt-4o-mini",
#   "created_at": "2026-08-15T12:34:56..."
# }

# If OPENROUTER_API_KEY is NOT set:
# Response: {"detail":"AI qualification failed: OPENROUTER_API_KEY is not configured..."}
```

---

## Docker Deployment

### Build Backend Image

```bash
docker build -t leadflow-ai-backend:latest backend/
```

### Run with Docker Compose

#### Option 1: Update docker-compose.yml

Add the backend service:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    container_name: leadflow-postgres
    environment:
      POSTGRES_USER: leadflow
      POSTGRES_PASSWORD: leadflow_prod_password
      POSTGRES_DB: leadflowai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U leadflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: backend/
    container_name: leadflow-backend
    environment:
      DATABASE_URL: postgresql://leadflow:leadflow_prod_password@postgres:5432/leadflowai
      SECRET_KEY: ${SECRET_KEY}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      ENVIRONMENT: production
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app  # Remove for production

volumes:
  postgres_data:
```

#### Option 2: Direct Docker Run

```bash
docker run \
  --name leadflow-backend \
  --network leadflow \
  -e DATABASE_URL="postgresql://leadflow:password@postgres:5432/leadflowai" \
  -e SECRET_KEY="your-secret-key-here" \
  -e OPENROUTER_API_KEY="your-api-key" \
  -p 8000:8000 \
  leadflow-ai-backend:latest
```

---

## Production Deployment Checklist

### Environment Variables

- [ ] `DATABASE_URL` — Production PostgreSQL connection string
- [ ] `SECRET_KEY` — Generated via `openssl rand -hex 32`
- [ ] `OPENROUTER_API_KEY` — Valid OpenRouter API key (or empty if mocking)
- [ ] `ENVIRONMENT` — Set to `production`

### Security

- [ ] `.env` file is NOT committed to git
- [ ] `.gitignore` includes `.env` and `.env.*`
- [ ] PostgreSQL password changed from default
- [ ] HTTPS/TLS enforced in reverse proxy (nginx/Caddy)
- [ ] CORS properly configured (see main.py)
- [ ] API rate limiting enabled (future enhancement)

### Database

- [ ] PostgreSQL 16+ deployed
- [ ] `alembic upgrade head` executed
- [ ] Backups configured
- [ ] Connection pooling enabled (pgBouncer)

### Monitoring

- [ ] Health check endpoint monitored: `/api/v1/health`
- [ ] Logs aggregated to centralized system
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Performance monitoring configured

### Deployment

- [ ] Docker image built and stored in registry
- [ ] Image scanned for vulnerabilities
- [ ] Kubernetes manifests prepared (optional)
- [ ] Rollback procedure documented

---

## Troubleshooting

### PostgreSQL Connection Error

```
ERROR: Attempted to connect to [database connection string] but received an error.
```

**Solution:**
1. Ensure `docker-compose up -d` is running
2. Verify `DATABASE_URL` in `.env` matches docker-compose config
3. Test connection: `psql postgresql://leadflow:leadflow@localhost:5432/leadflowai`

### Bcrypt/Passlib Incompatibility

```
AttributeError: module 'bcrypt' has no attribute '__about__'
```

**Solution:**
- Already fixed in `requirements.txt`
- Run: `pip install --break-system-packages -r requirements.txt`

### JWT Secret Missing

```
AIProviderError: OPENROUTER_API_KEY is not configured
```

This is expected if no OpenRouter key is set. Tests use mocked providers.

**Solution for live qualification:**
1. Get API key from https://openrouter.ai
2. Add to `.env`: `OPENROUTER_API_KEY=sk-or-...`
3. Restart backend

### Tests Fail

```
FAILED tests/test_qualification.py::test_qualify_lead_success
```

**Verify:**
1. PostgreSQL is running: `docker-compose ps`
2. Database initialized: `python -m alembic current`
3. Dependencies installed: `pip list | grep passlib`

---

## Development Workflow

### Creating a New Endpoint

1. **Create schema** (`app/schemas/`)
2. **Create model** (`app/models/`)
3. **Create service** (`app/services/`)
4. **Create router** (`app/api/v1/endpoints/`)
5. **Add to main router** (`app/api/v1/router.py`)
6. **Create tests** (`tests/`)
7. **Run tests**: `python -m pytest tests/test_new_feature.py -v`

### Example: Add Lead Status Field

```python
# 1. Update model
# backend/app/models/lead.py
status = Column(String, default="new")  # new|contacted|qualified|closed

# 2. Update schema
# backend/app/schemas/lead_schema.py
class LeadResponse(BaseModel):
    status: str

# 3. Create migration
python -m alembic revision --autogenerate -m "add_lead_status_field"

# 4. Apply migration
python -m alembic upgrade head

# 5. Update endpoint
# backend/app/api/v1/endpoints/lead.py
# Update LeadCreate/LeadUpdate to include status

# 6. Test
python -m pytest tests/test_lead.py -v
```

---

## Next Phases

### Phase 2: Frontend Dashboard (React)
- User authentication UI
- Lead management interface
- Qualification results display

### Phase 3: Email Automation
- n8n webhook integration
- Email template engine
- Notification service

### Phase 4: Advanced Analytics
- Lead scoring trends
- Conversion funnels
- User dashboards

---

## Support

### Documentation
- API Docs: `http://localhost:8000/docs` (Swagger UI)
- API Docs: `http://localhost:8000/redoc` (ReDoc)
- Verification Report: `DOCKER_VERIFICATION.md`

### Debugging
- Enable verbose logging: Add logging config to `app/main.py`
- Database inspection: Use `psql` client
- Test execution: `python -m pytest -vv --tb=short`

---

**Last Updated:** August 15, 2026  
**Maintainer:** LeadFlowAI Development Team
