"""Lead/discussion business logic.

The service layer is framework-agnostic: it takes a SQLAlchemy ``Session`` and
plain data, which makes it straightforward to unit test without HTTP.
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..errors import NotFoundError
from ..models.lead import Discussion, Lead, LeadStatus
from ..schemas.lead import DiscussionCreate, LeadCreate, LeadSummary, LeadUpdate
from ..timeutils import (
    FOLLOW_UP_NONE,
    FOLLOW_UP_OVERDUE,
    FOLLOW_UP_TODAY,
    classify_follow_up,
    ensure_aware,
    is_local_today,
    local_today,
    utc_now,
)

_VALID_FOLLOW_UP_FILTERS = {
    FOLLOW_UP_OVERDUE,
    FOLLOW_UP_TODAY,
    FOLLOW_UP_NONE,
    "upcoming",
}


class LeadService:
    """Encapsulates all read/write operations for leads and discussions."""

    def __init__(
        self,
        db: Session,
        *,
        tz: ZoneInfo | None = None,
        now: datetime | None = None,
    ) -> None:
        self.db = db
        self.tz = tz or get_settings().timezone
        self.now = ensure_aware(now) if now is not None else utc_now()
        self.dedup_window = get_settings().discussion_dedup_window_seconds

    # ------------------------------------------------------------------ reads
    def list_leads(
        self,
        *,
        statuses: list[LeadStatus] | None = None,
        search: str | None = None,
        follow_up: str | None = None,
    ) -> list[Lead]:
        """Return leads matching the given filters, soonest follow-up first."""
        stmt = select(Lead)

        if statuses:
            stmt = stmt.where(Lead.status.in_(statuses))

        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(Lead.name.ilike(term), Lead.company.ilike(term))
            )

        stmt = stmt.order_by(
            Lead.next_follow_up_at.asc().nulls_last(),
            Lead.updated_at.desc(),
            Lead.id.desc(),
        )

        leads = list(self.db.execute(stmt).scalars().unique().all())

        if follow_up and follow_up in _VALID_FOLLOW_UP_FILTERS:
            leads = [lead for lead in leads if self.follow_up_state(lead) == follow_up]

        return leads

    def get_lead(self, lead_id: int) -> Lead:
        lead = self.db.get(Lead, lead_id)
        if lead is None:
            raise NotFoundError(f"Lead {lead_id} was not found.")
        return lead

    def list_discussions(self, lead_id: int) -> list[Discussion]:
        # Ensures the lead exists (raises 404 otherwise).
        self.get_lead(lead_id)
        stmt = (
            select(Discussion)
            .where(Discussion.lead_id == lead_id)
            .order_by(Discussion.created_at.desc(), Discussion.id.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    # ----------------------------------------------------------------- writes
    def create_lead(self, data: LeadCreate) -> Lead:
        lead = Lead(
            name=data.name,
            company=data.company,
            phone=data.phone,
            status=data.status,
            created_at=self.now,
            updated_at=self.now,
        )
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def update_lead(self, lead_id: int, data: LeadUpdate) -> Lead:
        lead = self.get_lead(lead_id)
        fields = data.model_dump(exclude_unset=True)

        if "name" in fields and fields["name"] is not None:
            lead.name = fields["name"]
        if "company" in fields:
            lead.company = fields["company"]
        if "phone" in fields:
            lead.phone = fields["phone"]
        if "status" in fields and fields["status"] is not None:
            lead.status = fields["status"]
        if "next_follow_up_at" in fields:
            lead.next_follow_up_at = fields["next_follow_up_at"]

        lead.updated_at = self.now
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def add_discussion(
        self, lead_id: int, data: DiscussionCreate
    ) -> tuple[Discussion, bool]:
        """Create a discussion transactionally.

        Returns ``(discussion, created)`` where ``created`` is ``False`` when the
        submission was detected as a duplicate of the most recent discussion
        within the dedup window (idempotency guard against double submits).

        When ``follow_up_at`` is supplied, the lead's current follow-up is
        updated in the same transaction. When omitted, an existing follow-up is
        intentionally left untouched.
        """
        lead = self.get_lead(lead_id)

        existing = self._find_duplicate(lead, data)
        if existing is not None:
            return existing, False

        discussion = Discussion(
            lead_id=lead.id,
            note=data.note,
            follow_up_at=data.follow_up_at,
            created_at=self.now,
        )
        self.db.add(discussion)

        if data.follow_up_at is not None:
            lead.next_follow_up_at = data.follow_up_at
        lead.updated_at = self.now

        self.db.commit()
        self.db.refresh(discussion)
        self.db.refresh(lead)
        return discussion, True

    # ---------------------------------------------------------------- helpers
    def _find_duplicate(
        self, lead: Lead, data: DiscussionCreate
    ) -> Discussion | None:
        latest = lead.discussions[0] if lead.discussions else None
        if latest is None:
            return None

        if latest.note.strip() != data.note.strip():
            return None

        latest_follow = (
            ensure_aware(latest.follow_up_at) if latest.follow_up_at is not None else None
        )
        new_follow = (
            ensure_aware(data.follow_up_at) if data.follow_up_at is not None else None
        )
        if latest_follow != new_follow:
            return None

        age = (self.now - ensure_aware(latest.created_at)).total_seconds()
        if 0 <= age <= self.dedup_window:
            return latest
        return None

    def follow_up_state(self, lead: Lead) -> str:
        return classify_follow_up(lead.next_follow_up_at, self.tz, self.now)

    def to_summary(self, lead: Lead) -> LeadSummary:
        state = self.follow_up_state(lead)
        discussions = lead.discussions or []
        latest = discussions[0] if discussions else None

        return LeadSummary(
            id=lead.id,
            name=lead.name,
            company=lead.company,
            phone=lead.phone,
            status=lead.status,
            next_follow_up_at=lead.next_follow_up_at,
            follow_up_state=state,
            is_overdue=state == FOLLOW_UP_OVERDUE,
            is_today=is_local_today(lead.next_follow_up_at, self.tz, self.now),
            latest_note=latest.note if latest else None,
            latest_discussion_at=latest.created_at if latest else None,
            discussion_count=len(discussions),
            created_at=lead.created_at,
            updated_at=lead.updated_at,
        )

    @property
    def today(self):
        return local_today(self.tz, self.now)


def count_leads(db: Session) -> int:
    """Total number of leads (used by the seed command and diagnostics)."""
    return int(db.execute(select(func.count()).select_from(Lead)).scalar_one())
