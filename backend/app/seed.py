"""Idempotent database seed.

Usage::

    python -m app.seed

Seeding is keyed on ``(name, company)``: re-running the command never creates
duplicate leads. Follow-up timestamps are generated relative to *now* using the
configured ``APP_TIMEZONE`` so the demo always shows overdue, today and upcoming
items.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import SessionLocal
from .models.lead import Discussion, Lead, LeadStatus
from .timeutils import utc_now


@dataclass
class DiscussionSeed:
    note: str
    days_ago: float
    follow_up_in_days: float | None = None


@dataclass
class LeadSeed:
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    next_follow_up_in_days: float | None
    discussions: list[DiscussionSeed] = field(default_factory=list)


def _build_seed() -> list[LeadSeed]:
    return [
        LeadSeed(
            name="Priya Sharma",
            company="Northwind Analytics",
            phone="+1 415 555 0132",
            status=LeadStatus.QUALIFIED,
            next_follow_up_in_days=0.15,  # later today
            discussions=[
                DiscussionSeed(
                    note="Discovery call went well. They process ~2M events/day and "
                    "need reporting that non-technical staff can run.",
                    days_ago=9.0,
                ),
                DiscussionSeed(
                    note="Sent pricing comparison vs. their current BI vendor. "
                    "Priya is the economic buyer.",
                    days_ago=5.0,
                ),
                DiscussionSeed(
                    note="Followed up on security questionnaire. SOC 2 evidence "
                    "requested — looped in our compliance lead.",
                    days_ago=2.0,
                    follow_up_in_days=0.15,
                ),
            ],
        ),
        LeadSeed(
            name="Marcus Lee",
            company="Vertex Robotics",
            phone="+1 206 555 0177",
            status=LeadStatus.PROPOSAL_SENT,
            next_follow_up_in_days=1.4,  # tomorrow
            discussions=[
                DiscussionSeed(
                    note="Inbound from the pricing page. Wants a pilot for the "
                    "field-ops team (12 seats).",
                    days_ago=12.0,
                ),
                DiscussionSeed(
                    note="Demo delivered. Strong interest in the lead timeline and "
                    "follow-up reminders.",
                    days_ago=6.0,
                ),
                DiscussionSeed(
                    note="Proposal v2 sent. Awaiting legal review; expects a "
                    "decision this week.",
                    days_ago=1.5,
                    follow_up_in_days=1.4,
                ),
            ],
        ),
        LeadSeed(
            name="Elena García",
            company="Bluepeak Health",
            phone="+1 312 555 0148",
            status=LeadStatus.CONTACTED,
            next_follow_up_in_days=-2.0,  # overdue
            discussions=[
                DiscussionSeed(
                    note="Left two voicemails. Referral came through a happy "
                    "customer in the same region.",
                    days_ago=14.0,
                ),
                DiscussionSeed(
                    note="Reached her assistant; best time is Tuesday mornings.",
                    days_ago=4.0,
                    follow_up_in_days=-2.0,
                ),
            ],
        ),
        LeadSeed(
            name="Tom Becker",
            company="Harbor & Finch",
            phone="+1 617 555 0190",
            status=LeadStatus.NEW,
            next_follow_up_in_days=0.05,  # later today
            discussions=[
                DiscussionSeed(
                    note="Website form submission: interested in consolidating "
                    "three spreadsheets into one pipeline.",
                    days_ago=0.4,
                    follow_up_in_days=0.05,
                ),
            ],
        ),
        LeadSeed(
            name="Aisha Khan",
            company="Lumen Retail",
            phone="+1 646 555 0121",
            status=LeadStatus.WON,
            next_follow_up_in_days=None,
            discussions=[
                DiscussionSeed(
                    note="Champion identified — Head of RevOps. Budget approved.",
                    days_ago=30.0,
                ),
                DiscussionSeed(
                    note="Contract signed for 25 seats. Kickoff scheduled with "
                    "implementation team.",
                    days_ago=8.0,
                ),
                DiscussionSeed(
                    note="Handoff to customer success complete. Great expansion "
                    "potential across their EU team.",
                    days_ago=3.0,
                ),
            ],
        ),
        LeadSeed(
            name="David Okafor",
            company="Cascade Logistics",
            phone="+1 503 555 0165",
            status=LeadStatus.LOST,
            next_follow_up_in_days=-6.0,
            discussions=[
                DiscussionSeed(
                    note="Evaluating alongside two competitors. Price-sensitive.",
                    days_ago=22.0,
                ),
                DiscussionSeed(
                    note="Went with an incumbent tool already in their Microsoft "
                    "stack. Revisit in two quarters.",
                    days_ago=10.0,
                    follow_up_in_days=-6.0,
                ),
            ],
        ),
    ]


def seed_database(db: Session, *, tz: ZoneInfo | None = None) -> int:
    """Insert seed leads if absent. Returns the number of leads created."""
    settings = get_settings()
    tz = tz or settings.timezone
    now = utc_now()
    created = 0

    for spec in _build_seed():
        existing = db.execute(
            select(Lead).where(Lead.name == spec.name, Lead.company == spec.company)
        ).scalar_one_or_none()
        if existing is not None:
            continue

        earliest = min((d.days_ago for d in spec.discussions), default=0.0)
        lead = Lead(
            name=spec.name,
            company=spec.company,
            phone=spec.phone,
            status=spec.status,
            created_at=now - timedelta(days=earliest + 1),
            updated_at=now,
            next_follow_up_at=(
                now + timedelta(days=spec.next_follow_up_in_days)
                if spec.next_follow_up_in_days is not None
                else None
            ),
        )
        db.add(lead)
        db.flush()  # assign lead.id

        for discussion in spec.discussions:
            db.add(
                Discussion(
                    lead_id=lead.id,
                    note=discussion.note,
                    follow_up_at=(
                        now + timedelta(days=discussion.follow_up_in_days)
                        if discussion.follow_up_in_days is not None
                        else None
                    ),
                    created_at=now - timedelta(days=discussion.days_ago),
                )
            )

        created += 1

    db.commit()
    return created


def main() -> None:  # pragma: no cover - CLI entry point
    settings = get_settings()
    print(f"Seeding LeadFlow database at APP_TIMEZONE={settings.app_timezone} ...")
    with SessionLocal() as db:
        created = seed_database(db)
    if created:
        print(f"Seeded {created} new lead(s).")
    else:
        print("Database already seeded — no changes made (idempotent).")


if __name__ == "__main__":  # pragma: no cover
    main()
