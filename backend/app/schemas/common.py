"""Shared error envelope schemas.

All non-2xx responses share the shape::

    {"error": {"code": "not_found", "message": "...", "details": [...]}}

This keeps client-side error handling uniform across 404/409/422/500.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str = Field(..., description="Machine-readable error code.")
    message: str = Field(..., description="Human-readable error message.")
    details: list[dict[str, Any]] | None = Field(
        default=None, description="Optional field-level validation details."
    )


class ErrorResponse(BaseModel):
    error: ErrorBody
