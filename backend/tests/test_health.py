"""Health endpoint tests."""

from __future__ import annotations


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "database": "ok"}


def test_root_reports_service(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "LeadFlow API"
