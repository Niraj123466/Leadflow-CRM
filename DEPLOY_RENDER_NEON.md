# Deploy Backend to Render + Neon

## Step 1: Create Neon PostgreSQL Database (Free Tier)

1. Go to https://neon.tech and sign up (GitHub login works)
2. Click **"Create Project"**
3. Settings:
   - Project name: `leadflow`
   - Postgres version: `16` (default)
   - Region: `US East (N. Virginia)` - closest to Render's Oregon
4. Click **Create Project**
5. **Copy the connection string** (looks like):
   ```
   postgresql://leadflow_owner:xxxxxx@ep-xxx.us-east-1.aws.neon.tech/leadflow?sslmode=require
   ```
   > **Important:** Replace `postgresql://` with `postgresql+psycopg://` for SQLAlchemy:
   ```
   postgresql+psycopg://leadflow_owner:xxxxxx@ep-xxx.us-east-1.aws.neon.tech/leadflow?sslmode=require
   ```

## Step 2: Run Migrations on Neon Database

```bash
# From your local machine (backend directory)
cd /Users/nirajvaijinathmore/Desktop/dev/LeadFlow-Full_Stack_Lead_Management_Application/backend

# Set the Neon DATABASE_URL temporarily
export DATABASE_URL="postgresql+psycopg://leadflow_owner:xxxxxx@ep-xxx.us-east-1.aws.neon.tech/leadflow?sslmode=require"

# Run migrations
source .venv/bin/activate
alembic upgrade head

# Seed data
python -m app.seed
```

## Step 3: Deploy to Render

### Option A: Via Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select `Niraj123466/Leadflow-CRM`
4. Settings:
   - **Name**: `leadflow-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: `Free`
5. **Environment Variables** (click "Add Environment Variable"):
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string (with `postgresql+psycopg://`) |
   | `APP_TIMEZONE` | `UTC` |
   | `CORS_ORIGINS` | `https://frontend-omega-bice-d05rsgtqm1.vercel.app` |
   | `DISCUSSION_DEDUP_WINDOW_SECONDS` | `90` |
6. Click **"Create Web Service"**

### Option B: Via Render CLI (if you prefer)

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy (from repo root)
render deploy --service leadflow-backend
```

## Step 4: Wait for Build & Deploy

- First build takes 3-5 minutes (installs dependencies, runs migrations via Dockerfile CMD)
- Free tier spins down after 15 min inactivity; first request after spin-down takes ~30s
- Check logs in Render dashboard for any errors

## Step 5: Verify Backend Deployment

Once deployed, you'll get a URL like:
```
https://leadflow-backend-xxxx.onrender.com
```

Test it:
```bash
# Health check
curl https://leadflow-backend-xxxx.onrender.com/health
# Should return: {"status":"ok","database":"ok"}

# Test API
curl https://leadflow-backend-xxxx.onrender.com/api/leads
# Should return your 6 seeded leads
```

## Step 6: Update Vercel Frontend Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your `frontend` project
3. Go to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_API_BASE_URL`:
   - **Value**: `https://leadflow-backend-xxxx.onrender.com`
   - **Environment**: Production (and Preview if desired)
4. Click **Save**
5. **Redeploy**: Go to **Deployments** → Click **"..."** on latest → **Redeploy**

## Step 7: Test Full Application

1. Open your Vercel frontend URL: https://frontend-omega-bice-d05rsgtqm1.vercel.app
2. Verify:
   - Dashboard loads with 6 leads
   - Metric cards show correct counts
   - Click a lead → timeline dialog opens
   - Add new lead → appears in list
   - Add discussion with follow-up → updates immediately

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on `alembic upgrade head` | Ensure Neon DB allows connections from anywhere (0.0.0.0/0) - Neon default allows this |
| CORS errors in browser | Verify `CORS_ORIGINS` matches your Vercel URL exactly (including `https://`) |
| Database connection timeout | Neon free tier scales to zero - first request after idle takes longer; Render free tier also spins down |
| `psycopg` errors | Ensure connection string uses `postgresql+psycopg://` not `postgresql://` |
| Environment variables not picked up | Redeploy after adding env vars in Render dashboard |

---

## Neon Free Tier Limits

- **Storage**: 0.5 GB
- **Compute hours**: 100 hours/month (scales to zero when idle)
- **Projects**: 10
- **Branching**: ✅ Included

> **Note**: After 90 days, Render's free PostgreSQL would expire, but since you're using **Neon** for the database, only the **Render Web Service** needs to stay on free tier (which is permanent).

---

## Useful Links

- Render Dashboard: https://dashboard.render.com
- Neon Console: https://console.neon.tech
- Vercel Dashboard: https://vercel.com/dashboard
- Render Free Tier Limits: https://render.com/docs/free
- Neon Free Tier: https://neon.tech/pricing