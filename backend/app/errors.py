"""Structured error types and FastAPI exception handlers.

Every error response uses the envelope::

    {"error": {"code": "...", "message": "...", "details": [...]?}}
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class APIError(Exception):
    """Base class for domain errors that map to a structured response."""

    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, details: list[dict[str, Any]] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details

    def to_response(self) -> JSONResponse:
        body: dict[str, Any] = {"error": {"code": self.code, "message": self.message}}
        if self.details:
            body["error"]["details"] = self.details
        return JSONResponse(status_code=self.status_code, content=body)


class NotFoundError(APIError):
    status_code = 404
    code = "not_found"


class ConflictError(APIError):
    status_code = 409
    code = "conflict"


_STATUS_CODES: dict[int, str] = {
    400: "bad_request",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "validation_error",
    500: "internal_error",
}


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers so all errors share one envelope shape."""

    @app.exception_handler(APIError)
    async def _handle_api_error(_: Request, exc: APIError) -> JSONResponse:
        return exc.to_response()

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = []
        for error in exc.errors():
            details.append(
                {
                    "field": ".".join(str(part) for part in error.get("loc", [])),
                    "message": error.get("msg", "Invalid value."),
                    "type": error.get("type", "value_error"),
                }
            )
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "details": details,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http_error(
        _: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code = _STATUS_CODES.get(exc.status_code, "http_error")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": code, "message": str(exc.detail)}},
            headers=getattr(exc, "headers", None),
        )
