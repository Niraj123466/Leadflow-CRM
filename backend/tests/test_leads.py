"""Lead endpoint tests."""

from __future__ import annotations

from datetime import timedelta

from app.models.lead import LeadStatus
from app.timeutils import utc_now


def _payload(**overrides):
    data = {"name": "Ada Lovelace", "company": "Analytical Engines", "phone": "+1 555 0100"}
    data.update(overrides)
    return data


def test_create_lead_defaults_to_new(client):
    response = client.post("/api/leads", json=_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["name"] == "Ada Lovelace"
    assert body["status"] == "new"
    assert body["discussion_count"] == 0
    assert body["latest_note"] is None
    assert body["follow_up_state"] == "none"


def test_create_lead_accepts_only_name(client):
    response = client.post("/api/leads", json={"name": "Solo"})
    assert response.status_code == 201
    body = response.json()
    assert body["company"] is None
    assert body["phone"] is None


def test_create_lead_rejects_blank_name(client):
    response = client.post("/api/leads", json={"name": "   "})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(detail["field"].endswith("name") for detail in error["details"])


def test_create_lead_rejects_unknown_status(client):
    response = client.post("/api/leads", json=_payload(status="banana"))
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_create_lead_rejects_extra_fields(client):
    response = client.post("/api/leads", json=_payload(bogus="x"))
    assert response.status_code == 422


def test_list_returns_meta_and_items(client, lead_factory):
    lead_factory(name="Beta")
    lead_factory(name="Alpha")
    response = client.get("/api/leads")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert set(body) == {"items", "total", "today", "timezone"}
    assert body["timezone"] == "UTC"


def test_list_filters_by_status(client, lead_factory):
    lead_factory(name="New Guy", status=LeadStatus.NEW)
    lead_factory(name="Qualified Guy", status=LeadStatus.QUALIFIED)
    response = client.get("/api/leads", params={"status": "qualified"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Qualified Guy"


def test_list_filters_by_multiple_statuses(client, lead_factory):
    lead_factory(name="A", status=LeadStatus.NEW)
    lead_factory(name="B", status=LeadStatus.WON)
    lead_factory(name="C", status=LeadStatus.LOST)
    response = client.get("/api/leads", params=[("status", "won"), ("status", "lost")])
    assert response.json()["total"] == 2


def test_list_search_matches_name_or_company(client, lead_factory):
    lead_factory(name="Grace Hopper", company="Navy")
    lead_factory(name="Alan Turing", company="Bletchley")
    response = client.get("/api/leads", params={"search": "bletch"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Alan Turing"


def test_list_marks_overdue_follow_up(client, lead_factory):
    lead_factory(name="Late", next_follow_up_at=utc_now() - timedelta(days=1))
    response = client.get("/api/leads")
    item = response.json()["items"][0]
    assert item["follow_up_state"] == "overdue"
    assert item["is_overdue"] is True


def test_follow_up_due_earlier_today_is_overdue_and_today(client, lead_factory):
    lead_factory(name="Due earlier", next_follow_up_at=utc_now() - timedelta(hours=2))
    item = client.get("/api/leads").json()["items"][0]
    assert item["follow_up_state"] == "overdue"
    assert item["is_today"] is True


def test_get_lead_by_id(client, lead_factory):
    lead = lead_factory(name="Findable")
    response = client.get(f"/api/leads/{lead.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Findable"


def test_get_missing_lead_returns_404(client):
    response = client.get("/api/leads/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_patch_updates_status(client, lead_factory):
    lead = lead_factory(name="Mutable", status=LeadStatus.NEW)
    response = client.patch(f"/api/leads/{lead.id}", json={"status": "won"})
    assert response.status_code == 200
    assert response.json()["status"] == "won"

    # persisted
    assert client.get(f"/api/leads/{lead.id}").json()["status"] == "won"


def test_patch_rejects_invalid_status(client, lead_factory):
    lead = lead_factory()
    response = client.patch(f"/api/leads/{lead.id}", json={"status": "nope"})
    assert response.status_code == 422


def test_patch_missing_lead_returns_404(client):
    response = client.patch("/api/leads/424242", json={"status": "won"})
    assert response.status_code == 404


def test_patch_can_clear_follow_up(client, lead_factory):
    lead = lead_factory(next_follow_up_at=utc_now() + timedelta(days=2))
    response = client.patch(f"/api/leads/{lead.id}", json={"next_follow_up_at": None})
    assert response.status_code == 200
    assert response.json()["next_follow_up_at"] is None
    assert response.json()["follow_up_state"] == "none"


def test_patch_omitting_follow_up_keeps_it(client, lead_factory):
    follow_up = utc_now() + timedelta(days=2)
    lead = lead_factory(next_follow_up_at=follow_up)
    response = client.patch(f"/api/leads/{lead.id}", json={"company": "New Co"})
    assert response.json()["company"] == "New Co"
    assert response.json()["next_follow_up_at"] is not None
