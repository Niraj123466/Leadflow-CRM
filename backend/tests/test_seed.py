"""Seed command tests."""

from __future__ import annotations

from sqlalchemy import func, select

from app.models.lead import Discussion, Lead
from app.seed import seed_database


def test_seed_creates_at_least_five_leads_with_discussions(db):
    created = seed_database(db)
    assert created >= 5

    lead_count = db.execute(select(func.count()).select_from(Lead)).scalar_one()
    discussion_count = db.execute(select(func.count()).select_from(Discussion)).scalar_one()
    assert lead_count >= 5
    assert discussion_count >= lead_count  # multiple discussions per lead


def test_seed_is_idempotent(db):
    first = seed_database(db)
    second = seed_database(db)
    assert first >= 5
    assert second == 0


def test_seed_covers_varied_statuses(db):
    seed_database(db)
    statuses = {
        row[0] for row in db.execute(select(Lead.status).distinct()).all()
    }
    assert {"new", "contacted", "qualified", "proposal_sent", "won", "lost"} <= {
        s.value if hasattr(s, "value") else s for s in statuses
    }
