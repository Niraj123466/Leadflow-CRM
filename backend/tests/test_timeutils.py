"""Time zone classification unit tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.timeutils import (
    FOLLOW_UP_NONE,
    FOLLOW_UP_OVERDUE,
    FOLLOW_UP_TODAY,
    FOLLOW_UP_UPCOMING,
    classify_follow_up,
    is_local_today,
)

UTC = ZoneInfo("UTC")
KATHMANDU = ZoneInfo("Asia/Kathmandu")  # UTC+5:45, no DST


def _at(y, m, d, h=12, minute=0):
    return datetime(y, m, d, h, minute, tzinfo=timezone.utc)


def test_none_when_no_follow_up():
    assert classify_follow_up(None, UTC, _at(2026, 5, 1)) == FOLLOW_UP_NONE


def test_overdue_when_past():
    now = _at(2026, 5, 10)
    assert classify_follow_up(now - timedelta(hours=1), UTC, now) == FOLLOW_UP_OVERDUE


def test_today_when_later_today_in_app_timezone():
    now = _at(2026, 5, 10, 6)
    follow_up = _at(2026, 5, 10, 20)
    assert classify_follow_up(follow_up, UTC, now) == FOLLOW_UP_TODAY


def test_upcoming_tomorrow():
    now = _at(2026, 5, 10, 23)
    follow_up = _at(2026, 5, 11, 9)
    assert classify_follow_up(follow_up, UTC, now) == FOLLOW_UP_UPCOMING


def test_timezone_shifts_the_day_boundary():
    now = _at(2026, 5, 10, 23, 30)
    follow_up = _at(2026, 5, 11, 0, 30)
    # In UTC the follow-up lands on the next calendar day -> upcoming.
    assert classify_follow_up(follow_up, UTC, now) == FOLLOW_UP_UPCOMING
    # In Kathmandu it is the same local day as "now" -> today.
    assert classify_follow_up(follow_up, KATHMANDU, now) == FOLLOW_UP_TODAY


def test_is_local_today_counts_past_due_today():
    now = _at(2026, 5, 10, 15)
    earlier_today = _at(2026, 5, 10, 9)
    assert classify_follow_up(earlier_today, UTC, now) == FOLLOW_UP_OVERDUE
    assert is_local_today(earlier_today, UTC, now) is True
    assert is_local_today(None, UTC, now) is False
    assert is_local_today(_at(2026, 5, 9, 9), UTC, now) is False
