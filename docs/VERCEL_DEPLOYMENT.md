# SoilSense — Vercel Deployment Guide

This guide covers deploying the **SoilSense** platform to **Vercel**, including monorepo configuration, environment variables, and backend connectivity.

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     SoilSense Frontend          │
│        (Next.js 14)             │  ──▶  Deployed to VERCEL
│  Landing, Dashboard, 83 Pages   │       Global Edge Network, CDN & SSL
└─────────────────────────────────┘
                 │
                 │ /api/* rewrites or NEXT_PUBLIC_API_URL
                 ▼
┌─────────────────────────────────┐
│      SoilSense Backend          │
│       (FastAPI + ML)            │  ──▶  Deployed to RENDER / RAILWAY / VPS
│  SQLite DB, Telemetry Loop      │       Persistent Container & Background Loop
└─────────────────────────────────┘
```

> [!NOTE]
> The SoilSense frontend (Next.js 14) is pre-configured with **83 statically pre-rendered routes** (including the landing page, operator command center, and all 50+ documentation chapters). It can be deployed to Vercel immediately.

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push Code to GitHub / GitLab / Bitbucket

Ensure your repository is pushed to your Git provider:

```bash
git add .
git commit -m "Configure Vercel deployment for SoilSense"
git push origin main
```

### Step 2: Import into Vercel

1. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository.
3. Configure the **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `frontend` (or leave as root `/` since `vercel.json` is already provided).
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

In Vercel **Project Settings > Environment Variables**, add:

| Variable              | Recommended Value                                    | Purpose                                          |
| :-------------------- | :--------------------------------------------------- | :----------------------------------------------- |
| `BACKEND_URL`         | `https://your-backend.onrender.com`                  | Next.js server-side proxy target (prevents CORS) |
| `NEXT_PUBLIC_API_URL` | _(Optional)_ `https://your-backend.onrender.com/api` | Direct client-side API target                    |

> [!TIP]
> If you don't have a backend deployed yet, you can leave `BACKEND_URL` empty. The landing page, public documentation, and interactive UI components will still run standalone on Vercel!

### Step 4: Click "Deploy"

Vercel will build and deploy the application in under 60 seconds.

---

## Method 2: Deploy via Vercel CLI

You can also deploy directly from your local terminal:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Deploy preview to Vercel
npx vercel

# 3. Follow the CLI prompts:
# ? Set up and deploy? [Y/n] y
# ? Which scope do you want to deploy to? <Your Account>
# ? Link to existing project? [y/N] n
# ? What's your project's name? soilsense
# ? In which directory is your code located? ./

# 4. Deploy to Production
npx vercel --prod
```

---

## Deploying the Python FastAPI Backend

Because SoilSense uses a persistent SQLite database (`agrichem.db`), Scikit-Learn models, and continuous telemetry event loops, the Python backend needs a persistent container.

### Deploying Backend to Render (Free / Low Cost)

1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your Git repository.
3. Set the following parameters:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `ENVIRONMENT`: `production`
   - `PUMP_HARDWARE_ENABLED`: `false`
   - `SECRET_KEY`: `<Generate a random 32-char string>`
   - `DATABASE_URL`: `sqlite:///./data/agrichem.db`
5. Copy your Render service URL (e.g. `https://soilsense-api.onrender.com`).
6. Paste it into your Vercel project's `BACKEND_URL` environment variable.

### Deploying Backend with Docker

You can also use the included `docker-compose.yml` to deploy both frontend and backend to any cloud VPS (DigitalOcean, AWS EC2, Hetzner):

```bash
docker compose up -d --build
```

---

## Verifying the Deployment

Once deployed on Vercel:

1. Visit your Vercel URL (e.g. `https://soilsense.vercel.app`).
2. Verify the **Landing Page** loads.
3. Click **"Documentation"** to verify that all documentation pages, math formulas, and code snippets render.
4. Click **"Operator Sign In"** $\rightarrow$ demo login to access the **Command Center**.
