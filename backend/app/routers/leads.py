"""Lead and discussion HTTP endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, Response, status as http_status

from ..deps import LeadServiceDep
from ..models.lead import LeadStatus
from ..schemas.lead import (
    DiscussionCreate,
    DiscussionRead,
    LeadCreate,
    LeadDetail,
    LeadListResponse,
    LeadUpdate,
)

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("", response_model=LeadListResponse)
def list_leads(
    service: LeadServiceDep,
    status: Annotated[list[LeadStatus] | None, Query(description="Filter by status (repeatable).")] = None,
    search: Annotated[str | None, Query(description="Match against name or company.")] = None,
    follow_up: Annotated[
        str | None,
        Query(description="Filter by follow-up state: overdue|today|upcoming|none."),
    ] = None,
) -> LeadListResponse:
    """List leads with optional status/search/follow-up filters."""
    leads = service.list_leads(statuses=status, search=search, follow_up=follow_up)
    items = [service.to_summary(lead) for lead in leads]
    return LeadListResponse(
        items=items,
        total=len(items),
        today=service.today,
        timezone=service.tz.key,
    )


@router.post("", response_model=LeadDetail, status_code=http_status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, service: LeadServiceDep) -> LeadDetail:
    """Create a new lead (status defaults to ``new``)."""
    lead = service.create_lead(payload)
    return LeadDetail.model_validate(service.to_summary(lead))


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(lead_id: int, service: LeadServiceDep) -> LeadDetail:
    """Fetch a single lead by id."""
    lead = service.get_lead(lead_id)
    return LeadDetail.model_validate(service.to_summary(lead))


@router.patch("/{lead_id}", response_model=LeadDetail)
def update_lead(lead_id: int, payload: LeadUpdate, service: LeadServiceDep) -> LeadDetail:
    """Partially update a lead. Used by the status control in the timeline."""
    lead = service.update_lead(lead_id, payload)
    return LeadDetail.model_validate(service.to_summary(lead))


@router.get("/{lead_id}/discussions", response_model=list[DiscussionRead])
def list_discussions(lead_id: int, service: LeadServiceDep) -> list[DiscussionRead]:
    """Return a lead's discussion history, newest first."""
    return [DiscussionRead.model_validate(d) for d in service.list_discussions(lead_id)]


@router.post(
    "/{lead_id}/discussions",
    response_model=DiscussionRead,
    status_code=http_status.HTTP_201_CREATED,
)
def create_discussion(
    lead_id: int,
    payload: DiscussionCreate,
    service: LeadServiceDep,
    response: Response,
) -> DiscussionRead:
    """Add a discussion note, optionally scheduling the next follow-up.

    Returns ``201`` when a new record is created and ``200`` when an identical
    submission within the dedup window is collapsed onto the existing record.
    """
    discussion, created = service.add_discussion(lead_id, payload)
    if not created:
        response.status_code = http_status.HTTP_200_OK
    return DiscussionRead.model_validate(discussion)
