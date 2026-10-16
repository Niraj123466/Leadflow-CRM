# LeadFlow backend — FastAPI + SQLAlchemy + PostgreSQL
# Build:  docker build -t leadflow-backend ./backend
# Run:    docker run --rm -p 8000:8000 --env-file .env leadflow-backend

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for psycopg (binary wheels exist, but keep minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app
# alembic.ini must live at the working dir (/app) — alembic looks for it there
COPY alembic.ini ./
COPY alembic/env.py alembic/versions ./alembic/

# Non-root user
RUN useradd --create-home --shell /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Run migrations on startup, then start the server ($PORT is injected by Render)
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}