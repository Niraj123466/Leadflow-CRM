"""Application configuration loaded from environment variables.

Every setting has a safe local-development default, but production deployments
are expected to provide ``DATABASE_URL`` and ``APP_TIMEZONE`` explicitly.
"""

from __future__ import annotations

from functools import lru_cache
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings.

    ``pydantic-settings`` reads matching environment variables
    (case-insensitively), so ``DATABASE_URL`` populates ``database_url``.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = "postgresql+psycopg://leadflow:leadflow@localhost:5432/leadflow"

    # IANA timezone that defines the "today" and "overdue" boundaries.
    app_timezone: str = "UTC"

    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:3000"

    # Idempotency guard: identical discussion within N seconds is ignored.
    discussion_dedup_window_seconds: int = 90

    # SQL statement echo (development only).
    sql_echo: bool = False

    @field_validator("app_timezone")
    @classmethod
    def _validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:  # pragma: no cover - config guard
            raise ValueError(f"Unknown IANA timezone: {value!r}") from exc
        return value

    @property
    def timezone(self) -> ZoneInfo:
        """Return the configured timezone as a ``ZoneInfo`` object."""
        return ZoneInfo(self.app_timezone)

    @property
    def cors_origin_list(self) -> list[str]:
        """Return the CORS allow-list as a list of origins."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance."""
    return Settings()
