"""Shared pytest fixtures.

Tests run against a real PostgreSQL database (``leadflow_test`` by default) so
that timezone-aware ``DateTime`` columns and CHECK constraints behave exactly as
in production. The database is created automatically if missing, and every test
runs inside a transaction that is rolled back at the end.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.database import Base, get_session
from app.main import app

DEFAULT_TEST_URL = "postgresql+psycopg://postgres@localhost:5432/leadflow_test"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_URL)


def _ensure_database(url_str: str) -> None:
    """Create the target database if it does not already exist."""
    url = make_url(url_str)
    db_name = url.database
    admin_url = url.set(database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT", poolclass=NullPool)
    try:
        with admin_engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": db_name},
            ).scalar()
            if not exists:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        admin_engine.dispose()


@pytest.fixture(scope="session")
def engine():
    _ensure_database(TEST_DATABASE_URL)
    eng = create_engine(TEST_DATABASE_URL, poolclass=NullPool, future=True)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db(engine) -> Iterator[Session]:
    """A session bound to a transaction that is rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db: Session) -> Iterator[TestClient]:
    """A TestClient whose DB dependency is the rolled-back test session."""

    def _override_get_session() -> Iterator[Session]:
        yield db

    app.dependency_overrides[get_session] = _override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def lead_factory(db: Session):
    """Create leads quickly inside a test."""
    from app.models.lead import Lead, LeadStatus
    from app.timeutils import utc_now

    def _make(**kwargs) -> Lead:
        now = utc_now()
        lead = Lead(
            name=kwargs.get("name", "Test Lead"),
            company=kwargs.get("company", "Test Co"),
            phone=kwargs.get("phone"),
            status=kwargs.get("status", LeadStatus.NEW),
            next_follow_up_at=kwargs.get("next_follow_up_at"),
            created_at=now,
            updated_at=now,
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead

    return _make
