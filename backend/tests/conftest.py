"""
Shared test fixtures.

Uses the project's real Postgres engine (from app.core.database) rather
than swapping in SQLite, since app.core.database hardcodes its own
engine independently of app.core.config.settings and isn't currently
overridable — see the inspection report. Each test runs inside its own
transaction that is rolled back afterward (a SAVEPOINT-based session,
per SQLAlchemy's standard test-isolation recipe), so tests never leave
data behind and never depend on execution order.

Requires a reachable Postgres matching the credentials in
app/core/database.py (the same instance docker-compose.yml provisions
for local development).
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, engine, get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.lead import Lead
# Import registers the model with Base.metadata for create_all below.
from app.models import lead_qualification  # noqa: F401


@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    connection = engine.connect()
    outer_transaction = connection.begin()

    TestingSession = sessionmaker(bind=connection)
    session = TestingSession()
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    yield session

    session.close()
    outer_transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _make_user(db_session):
    # NOTE: not using AuthService.hash_password() here — see SESSION_NOTES.md.
    # A pre-existing passlib/bcrypt version incompatibility in this repo's
    # unpinned dependencies currently breaks real hashing; unrelated to the
    # qualification module and out of scope to fix here. These tests never
    # exercise login/password verification, only JWT-based access, so a
    # placeholder value is sufficient and doesn't mask anything we're
    # actually testing.
    user = User(
        name="Test User",
        email=f"user-{uuid.uuid4()}@example.com",
        password="test-placeholder-hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture()
def test_user(db_session):
    return _make_user(db_session)


@pytest.fixture()
def other_user(db_session):
    return _make_user(db_session)


def _auth_headers_for(user):
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers(test_user):
    return _auth_headers_for(test_user)


@pytest.fixture()
def other_auth_headers(other_user):
    return _auth_headers_for(other_user)


@pytest.fixture()
def test_lead(db_session, test_user):
    lead = Lead(
        name="Jane Prospect",
        email="jane@example.com",
        phone="555-1234",
        company="Acme Corp",
        message="Interested in the enterprise plan, asked about pricing.",
        user_id=test_user.id,
    )
    db_session.add(lead)
    db_session.flush()
    return lead
