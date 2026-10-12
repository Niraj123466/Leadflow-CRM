# LeadFlow — Full-Stack Lead Management Application

A lightweight CRM for sales representatives built with Next.js 16, FastAPI, PostgreSQL, and modern tooling. The entire application operates on a single screen with dialogs for lead creation and timeline management.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix primitives), TanStack Query v5, React Hook Form + Zod |
| Backend | FastAPI 0.143, Pydantic v2, SQLAlchemy 2.0, Alembic, psycopg v3 |
| Database | PostgreSQL 16 |
| Testing | Vitest + React Testing Library (frontend), Pytest (backend) |
| Infrastructure | Docker Compose, uv/venv, npm |

## Prerequisites

- **Node.js** ≥ 20 (tested with 23.6.1)
- **Python** ≥ 3.12 (tested with 3.14.7)
- **PostgreSQL** ≥ 14 (tested with 16)
- **Docker** ≥ 24 (optional, for containerized deployment)

## Quick Start (Local Development)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd LeadFlow-Full_Stack_Lead_Management_Application

# Backend environment
cp .env.example backend/.env
# Edit backend/.env if your PostgreSQL credentials differ

# Frontend environment
cp .env.example frontend/.env.local
```

### 2. Database setup

```bash
# Create databases (macOS/Linux with Homebrew Postgres)
createdb leadflow
createdb leadflow_test

# Or with Docker
docker run -d --name leadflow-db \
  -e POSTGRES_USER=leadflow -e POSTGRES_PASSWORD=leadflow -e POSTGRES_DB=leadflow \
  -p 5432:5432 postgres:16
```

### 3. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Run migrations
alembic upgrade head

# Seed demo data (idempotent)
python -m app.seed

# Start API server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000 (redirects to /dashboard)

### 5. Run tests

```bash
# Backend (requires leadflow_test database)
cd backend
TEST_DATABASE_URL="postgresql+psycopg://user@localhost:5432/leadflow_test" pytest -q

# Frontend
cd frontend
npm test
```

## Docker Compose (Production-like)

```bash
# From repository root
docker compose up --build
```

Services:
- **db** — PostgreSQL on port 5432 (persistent volume `pgdata`)
- **backend** — FastAPI on port 8000
- **frontend** — Next.js on port 3000

Health checks are configured for all services.

## Environment Variables

All required variables are documented in `.env.example`. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy connection URL (psycopg v3) | `postgresql+psycopg://leadflow:leadflow@localhost:5432/leadflow` |
| `APP_TIMEZONE` | IANA timezone for "today"/"overdue" boundaries | `UTC` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `DISCUSSION_DEDUP_WINDOW_SECONDS` | Idempotency window for duplicate discussions | `90` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL reachable from browser | `http://localhost:8000` |

## Project Structure

```
LeadFlow/
├── .env.example                 # Environment template
├── docker-compose.yml           # Multi-service orchestration
├── README.md                    # This file
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # Engine, session, Base
│   │   ├── main.py              # FastAPI factory
│   │   ├── deps.py              # FastAPI dependencies
│   │   ├── errors.py            # Structured error handling
│   │   ├── timeutils.py         # Timezone-aware helpers
│   │   ├── models/lead.py       # Lead, Discussion, LeadStatus
│   │   ├── schemas/lead.py      # Request/response models
│   │   ├── services/leads.py    # Business logic
│   │   ├── routers/health.py    # GET /health
│   │   ├── routers/leads.py     # Lead & discussion endpoints
│   │   └── seed.py              # Idempotent seed command
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest suite
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
│   └── pytest.ini
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx       # Root layout + Providers
    │   │   ├── page.tsx         # Redirect to /dashboard
    │   │   ├── providers.tsx    # QueryClient + Toaster
    │   │   ├── globals.css      # Theme tokens + base styles
    │   │   └── dashboard/       # Dashboard page (client)
    │   ├── components/
    │   │   ├── ui/              # shadcn-style primitives
    │   │   └── dashboard/       # Dashboard-specific components
    │   ├── hooks/use-leads.ts   # TanStack Query hooks
    │   ├── lib/
    │   │   ├── api.ts           # Typed API client
    │   │   ├── format.ts        # Date/time formatting
    │   │   ├── query-client.ts  # QueryClient factory
    │   │   └── utils.ts         # cn() helper
    │   ├── schemas/lead.ts      # Zod form schemas
    │   └── types/lead.ts        # Shared TypeScript types
    ├── public/
    ├── Dockerfile
    ├── vitest.config.ts
    └── package.json
```

## API Reference

All endpoints return structured errors: `{ "error": { "code": "...", "message": "...", "details": [...]? } }`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness/readiness probe |
| GET | `/api/leads` | List leads with filters (`status`, `search`, `follow_up`) |
| POST | `/api/leads` | Create lead (status defaults to `new`) |
| GET | `/api/leads/{id}` | Get lead detail |
| PATCH | `/api/leads/{id}` | Partial update (status, follow-up, etc.) |
| GET | `/api/leads/{id}/discussions` | Discussion history (newest first) |
| POST | `/api/leads/{id}/discussions` | Add discussion (updates follow-up if provided) |

### Filtering

```
GET /api/leads?status=new&status=contacted&search=acme&follow_up=overdue
```

- `status` — repeatable, one of `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`
- `search` — case-insensitive match on name or company
- `follow_up` — one of `overdue`, `today`, `upcoming`, `none`

### Discussion Idempotency

Submitting an identical `note` + `follow_up_at` within `DISCUSSION_DEDUP_WINDOW_SECONDS` (default 90s) returns the existing record (200) instead of creating a duplicate (201).

### Timezone Policy

All timestamps stored as **timezone-aware UTC**. The `APP_TIMEZONE` setting defines calendar-day boundaries for "today" and "overdue". The API returns computed `follow_up_state` and the current `today` date so clients never re-implement this logic.

## Design System

- **Dark-navy theme** defined in `globals.css` via CSS custom properties
- **shadcn/ui primitives** (Button, Input, Dialog, Select, Badge, Card, etc.)
- **Lucide icons** for UI icons
- **Responsive**: table layout on desktop (≥1024px), card stack on mobile
- **Accessible**: keyboard navigation, focus-visible rings, ARIA labels, dialog focus management

## Seeding

```bash
cd backend
python -m app.seed
```

Creates 6 realistic leads with varied statuses and discussion histories. Idempotent — re-running makes no changes.

## Testing

### Backend (38 tests)

```bash
cd backend
TEST_DATABASE_URL="postgresql+psycopg://user@localhost:5432/leadflow_test" pytest -q
# or: pytest tests/ -v
```

Coverage areas: health, time utils, lead CRUD, discussions, seed idempotency.

### Frontend (21 tests)

```bash
cd frontend
npm test
```

Coverage: format utilities, query hooks (list, create, update, discussions).

## Manual QA Checklist

- [ ] Dashboard loads with seeded leads
- [ ] Metric cards show correct counts (total, today, qualified, won)
- [ ] Search filters by name/company in real time
- [ ] Status chips filter correctly (multi-select)
- [ ] "Today's follow-ups" section pinned above list
- [ ] Overdue follow-ups highlighted in red
- [ ] Click lead → timeline dialog opens with history (newest first)
- [ ] Status dropdown in sidebar changes status instantly
- [ ] Add note with follow-up date/time → list updates immediately
- [ ] Add note without follow-up → existing follow-up preserved
- [ ] "Add Lead" dialog validates required name field
- [ ] New lead appears in list after creation
- [ ] Mobile viewport shows card layout, not horizontal scroll
- [ ] Keyboard navigation works throughout (Tab, Enter, Escape)
- [ ] Error states display when API unreachable
- [ ] Empty state shows when no leads match filters

## Git Commit Recommendations

```bash
# Initial scaffold
git add . && git commit -m "chore: initial repo structure with Next.js + FastAPI"

# Backend core
git add backend && git commit -m "feat(backend): FastAPI app with SQLAlchemy models, Alembic migration, seed command"

# API endpoints
git add backend && git commit -m "feat(backend): lead & discussion REST endpoints with filtering, validation, idempotency"

# Backend tests
git add backend/tests && git commit -m "test(backend): pytest suite for health, timeutils, leads, discussions, seed"

# Frontend UI primitives
git add frontend/src/components/ui && git commit -m "feat(frontend): shadcn-style UI primitives (Button, Input, Dialog, Select, Badge, Card)"

# Dashboard components
git add frontend/src/components/dashboard && git commit -m "feat(frontend): dashboard components (MetricCards, StatusFilter, LeadList, TimelineDialog, AddLeadDialog)"

# Data layer
git add frontend/src/hooks frontend/src/lib frontend/src/types frontend/src/schemas && git commit -m "feat(frontend): TanStack Query hooks, typed API client, Zod schemas, formatting utils"

# Dashboard page & routing
git add frontend/src/app && git commit -m "feat(frontend): dashboard page with responsive layout, providers, client-side rendering"

# Frontend tests
git add frontend/src/**/*.test.* && git commit -m "test(frontend): Vitest + RTL tests for hooks and format utilities"

# Docker & docs
git add docker-compose.yml backend/Dockerfile frontend/Dockerfile README.md .env.example && git commit -m "chore: Docker Compose, Dockerfiles, README, env template"
```

## Publishing to GitHub

```bash
# 1. Create repo on GitHub (no README/license/gitignore — we have our own)
# 2. Push
git remote add origin https://github.com/<your-username>/LeadFlow.git
git branch -M main
git push -u origin main

# 3. Enable GitHub Actions (optional) for CI
```

### Recording a Demo

```bash
# 1. Start services
docker compose up --build

# 2. Open http://localhost:3000 in browser
# 3. Record screen (macOS: Cmd+Shift+5, Windows: Win+G, Linux: OBS)
# 4. Demonstrate:
#    - Dashboard with metrics and lead list
#    - Search and status filtering
#    - Click lead → timeline dialog with history
#    - Change status in sidebar
#    - Add discussion with follow-up
#    - Add new lead
#    - Mobile responsive view (DevTools device toolbar)
```

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| `alembic: command not found` | Activate venv: `source backend/.venv/bin/activate` |
| `psycopg.OperationalError` | Ensure PostgreSQL is running and `DATABASE_URL` matches credentials |
| `ModuleNotFoundError: No module named 'app'` | Run from `backend/` directory or set `PYTHONPATH=.` |
| Frontend shows "No QueryClient set" | Ensure `Providers` wraps the app (check `layout.tsx`) |
| `CORS` errors in browser | Verify `CORS_ORIGINS` includes your frontend origin |
| Docker `db` healthcheck fails | Wait longer; `pg_isready` retries 10× at 5s intervals |
| `npm run build` fails on dashboard | Page is `force-dynamic`; ensure `next.config.ts` has no `cacheComponents` |

## License

MIT — see `LICENSE` if added.

---

Built with ☕ by a lazy senior developer who believes the best code is the code never written.