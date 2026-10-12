"""Lead and Discussion ORM models (SQLAlchemy 2.0 typed style)."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:  # pragma: no cover
    pass


class LeadStatus(str, enum.Enum):
    """Permitted lifecycle states for a lead."""

    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    WON = "won"
    LOST = "lost"


# A database-level CHECK constraint keeps the permitted values enforced even if
# a row is written outside of the API.
LeadStatusType = Enum(
    LeadStatus,
    name="lead_status",
    native_enum=False,
    validate_strings=True,
    length=32,
)


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[LeadStatus] = mapped_column(
        LeadStatusType,
        nullable=False,
        default=LeadStatus.NEW,
        server_default=LeadStatus.NEW.value,
    )
    next_follow_up_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    discussions: Mapped[list["Discussion"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="Discussion.created_at.desc()",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_leads_status", "status"),
        Index("ix_leads_next_follow_up_at", "next_follow_up_at"),
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Lead id={self.id} name={self.name!r} status={self.status}>"


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    # Optional follow-up *recorded with this discussion*. The lead's current
    # follow-up is denormalised onto ``Lead.next_follow_up_at``.
    follow_up_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    lead: Mapped[Lead] = relationship(back_populates="discussions")

    __table_args__ = (Index("ix_discussions_lead_id_created_at", "lead_id", "created_at"),)

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<Discussion id={self.id} lead_id={self.lead_id}>"
