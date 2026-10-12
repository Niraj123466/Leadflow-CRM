"""Reusable FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from .database import get_session
from .services.leads import LeadService

SessionDep = Annotated[Session, Depends(get_session)]


def get_lead_service(db: SessionDep) -> LeadService:
    """Provide a request-scoped :class:`LeadService`."""
    return LeadService(db)


LeadServiceDep = Annotated[LeadService, Depends(get_lead_service)]
