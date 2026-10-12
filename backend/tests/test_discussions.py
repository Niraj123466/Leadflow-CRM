"""Discussion endpoint and business-rule tests."""

from __future__ import annotations

from datetime import timedelta

from app.timeutils import utc_now


def test_create_discussion_updates_latest_note(client, lead_factory):
    lead = lead_factory(name="Chatty")
    response = client.post(
        f"/api/leads/{lead.id}/discussions",
        json={"note": "First touch — intro email sent."},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["note"] == "First touch — intro email sent."
    assert body["lead_id"] == lead.id

    detail = client.get(f"/api/leads/{lead.id}").json()
    assert detail["latest_note"] == "First touch — intro email sent."
    assert detail["discussion_count"] == 1
    assert detail["latest_discussion_at"] is not None


def test_discussion_with_follow_up_updates_lead(client, lead_factory):
    lead = lead_factory()
    follow_up = (utc_now() + timedelta(days=3)).replace(microsecond=0)
    response = client.post(
        f"/api/leads/{lead.id}/discussions",
        json={"note": "Schedule demo", "follow_up_at": follow_up.isoformat()},
    )
    assert response.status_code == 201
    detail = client.get(f"/api/leads/{lead.id}").json()
    assert detail["follow_up_state"] == "upcoming"
    assert detail["next_follow_up_at"] is not None


def test_discussion_without_follow_up_does_not_clear_existing(client, lead_factory):
    follow_up = utc_now() + timedelta(days=5)
    lead = lead_factory(next_follow_up_at=follow_up)
    client.post(
        f"/api/leads/{lead.id}/discussions",
        json={"note": "Just a note, no new date."},
    )
    detail = client.get(f"/api/leads/{lead.id}").json()
    assert detail["next_follow_up_at"] is not None


def test_discussions_returned_newest_first(client, lead_factory):
    lead = lead_factory()
    for note in ["one", "two", "three"]:
        response = client.post(
            f"/api/leads/{lead.id}/discussions", json={"note": note}
        )
        assert response.status_code == 201, response.text
    # Ensure ordering is deterministic even with identical timestamps.
    import time as _time

    _time.sleep(0.01)
    listing = client.get(f"/api/leads/{lead.id}/discussions").json()
    assert [d["note"] for d in listing] == ["three", "two", "one"]


def test_duplicate_discussion_is_collapsed(client, lead_factory):
    lead = lead_factory()
    payload = {"note": "Same note", "follow_up_at": (utc_now() + timedelta(days=1)).isoformat()}

    first = client.post(f"/api/leads/{lead.id}/discussions", json=payload)
    second = client.post(f"/api/leads/{lead.id}/discussions", json=payload)

    assert first.status_code == 201
    assert second.status_code == 200  # collapsed onto the existing record
    assert first.json()["id"] == second.json()["id"]
    assert client.get(f"/api/leads/{lead.id}").json()["discussion_count"] == 1


def test_discussion_rejects_blank_note(client, lead_factory):
    lead = lead_factory()
    response = client.post(f"/api/leads/{lead.id}/discussions", json={"note": "   "})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_discussion_on_missing_lead_returns_404(client):
    response = client.post("/api/leads/987654/discussions", json={"note": "hi"})
    assert response.status_code == 404


def test_list_discussions_for_missing_lead_returns_404(client):
    assert client.get("/api/leads/987654/discussions").status_code == 404


def test_list_discussions_empty_for_new_lead(client, lead_factory):
    lead = lead_factory()
    response = client.get(f"/api/leads/{lead.id}/discussions")
    assert response.status_code == 200
    assert response.json() == []
