"""Health check endpoint."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from ..deps import SessionDep

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: SessionDep) -> dict[str, str]:
    """Liveness/readiness probe.

    Returns ``ok`` only when the database is reachable, which makes this usable
    as a Docker health check.
    """
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
