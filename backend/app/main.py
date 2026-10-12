"""LeadFlow FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import get_settings
from .errors import register_exception_handlers
from .routers import health, leads


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="LeadFlow API",
        version=__version__,
        description="Lightweight lead management API for sales representatives.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health.router)
    app.include_router(leads.router)

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"service": "LeadFlow API", "version": __version__, "docs": "/docs"}

    return app


app = create_app()
