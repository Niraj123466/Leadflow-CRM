"""Time zone aware helpers shared by the service layer.

Timezone policy
---------------
* All timestamps are stored **timezone-aware in UTC** (``DateTime(timezone=True)``).
* The *application timezone* (``APP_TIMEZONE``, default ``UTC``) defines what
  "today" and "overdue" mean. This is the single source of truth and it is
  applied in exactly one place: :func:`classify_follow_up`.
* API responses expose the computed ``follow_up_state`` plus the ``today`` date
  and ``timezone`` in the list envelope, so clients never re-implement the
  boundary logic.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

FOLLOW_UP_NONE = "none"
FOLLOW_UP_OVERDUE = "overdue"
FOLLOW_UP_TODAY = "today"
FOLLOW_UP_UPCOMING = "upcoming"


def utc_now() -> datetime:
    """Return the current instant as a timezone-aware UTC ``datetime``."""
    return datetime.now(tz=timezone.utc)


def ensure_aware(value: datetime) -> datetime:
    """Return ``value`` as timezone-aware UTC.

    Naive datetimes are assumed to be UTC. This keeps comparisons safe even if
    a driver hands back a naive value.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_local(value: datetime, tz: ZoneInfo) -> datetime:
    """Convert an instant to the given timezone."""
    return ensure_aware(value).astimezone(tz)


def local_today(tz: ZoneInfo, now: datetime | None = None) -> date:
    """Return the current calendar date in ``tz``."""
    reference = ensure_aware(now) if now is not None else utc_now()
    return to_local(reference, tz).date()


def is_local_today(
    value: datetime | None,
    tz: ZoneInfo,
    now: datetime | None = None,
) -> bool:
    """Return ``True`` when ``value`` falls on today's calendar date in ``tz``.

    Unlike :func:`classify_follow_up` this ignores the time of day, so a
    follow-up that was due earlier today still counts as "today".
    """
    if value is None:
        return False
    reference = ensure_aware(now) if now is not None else utc_now()
    return to_local(ensure_aware(value), tz).date() == local_today(tz, reference)


def classify_follow_up(
    follow_up_at: datetime | None,
    tz: ZoneInfo,
    now: datetime | None = None,
) -> str:
    """Classify a follow-up timestamp for the given timezone.

    Returns one of ``none``, ``overdue``, ``today`` or ``upcoming``.

    * ``overdue``  – the instant is strictly in the past.
    * ``today``    – the local calendar date equals today but the instant is
      still in the future.
    * ``upcoming`` – the local calendar date is after today.
    """
    if follow_up_at is None:
        return FOLLOW_UP_NONE

    reference = ensure_aware(now) if now is not None else utc_now()
    follow_up_at = ensure_aware(follow_up_at)

    if follow_up_at < reference:
        return FOLLOW_UP_OVERDUE

    if to_local(follow_up_at, tz).date() == local_today(tz, reference):
        return FOLLOW_UP_TODAY

    return FOLLOW_UP_UPCOMING
