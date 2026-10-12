"""Lead and discussion request/response schemas."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..models.lead import LeadStatus

# Expose the permitted status values to OpenAPI as a Literal union.
LeadStatusLiteral = Literal["new", "contacted", "qualified", "proposal_sent", "won", "lost"]

FollowUpState = Literal["none", "overdue", "today", "upcoming"]

_Name = Annotated[str, Field(min_length=1, max_length=200)]
_Company = Annotated[str | None, Field(default=None, max_length=200)]
_Phone = Annotated[str | None, Field(default=None, max_length=50)]


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def _as_utc(value: datetime | None) -> datetime | None:
    """Coerce a datetime to timezone-aware UTC (naive input is assumed UTC)."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class LeadCreate(BaseModel):
    """Payload for ``POST /api/leads``."""

    model_config = ConfigDict(extra="forbid")

    name: _Name
    company: _Company = None
    phone: _Phone = None
    status: LeadStatus = LeadStatus.NEW

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name must not be empty.")
        return cleaned

    @field_validator("company", "phone", mode="before")
    @classmethod
    def _clean_optional(cls, value: str | None) -> str | None:
        return _blank_to_none(value)


class LeadUpdate(BaseModel):
    """Payload for ``PATCH /api/leads/{id}``. All fields are optional.

    ``next_follow_up_at`` may be explicitly set to ``null`` to clear the
    follow-up. Omitting the field leaves the current value untouched.
    """

    model_config = ConfigDict(extra="forbid")

    name: _Name | None = None
    company: _Company = None
    phone: _Phone = None
    status: LeadStatus | None = None
    next_follow_up_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name must not be empty.")
        return cleaned

    @field_validator("company", "phone", mode="before")
    @classmethod
    def _clean_optional(cls, value: str | None) -> str | None:
        return _blank_to_none(value)

    @field_validator("next_follow_up_at")
    @classmethod
    def _clean_follow_up(cls, value: datetime | None) -> datetime | None:
        return _as_utc(value)


class DiscussionCreate(BaseModel):
    """Payload for ``POST /api/leads/{id}/discussions``."""

    model_config = ConfigDict(extra="forbid")

    note: Annotated[str, Field(min_length=1, max_length=5000)]
    follow_up_at: datetime | None = None

    @field_validator("note")
    @classmethod
    def _clean_note(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Note must not be empty.")
        return cleaned

    @field_validator("follow_up_at")
    @classmethod
    def _clean_follow_up(cls, value: datetime | None) -> datetime | None:
        return _as_utc(value)


class DiscussionRead(BaseModel):
    """A single discussion record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    follow_up_at: datetime | None
    created_at: datetime


class LeadSummary(BaseModel):
    """Row shape for the lead list, including derived follow-up fields."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    next_follow_up_at: datetime | None
    follow_up_state: FollowUpState
    is_overdue: bool
    is_today: bool
    latest_note: str | None
    latest_discussion_at: datetime | None
    discussion_count: int
    created_at: datetime
    updated_at: datetime


class LeadDetail(LeadSummary):
    """Lead detail (identical to summary plus nothing extra).

    Kept as a distinct type so the detail response can evolve independently.
    """


class LeadListResponse(BaseModel):
    """Envelope returned by ``GET /api/leads``."""

    items: list[LeadSummary]
    total: int
    today: date
    timezone: str
