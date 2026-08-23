# 🚀 Deploy Last Mile Delivery — Railway + Vercel

> **Backend** → Railway (Node.js + PostgreSQL)
> **Frontend** → Vercel (Vite React SPA)

---

## Prerequisites

- [GitHub](https://github.com) account with this repo pushed
- [Railway](https://railway.app) account (free tier works)
- [Vercel](https://vercel.com) account (free tier works)

---

## Part 1 — Backend on Railway

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Railway + Vercel deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Pick your repository
4. Railway will detect the monorepo — set the **Root Directory** to `backend`

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically creates a `DATABASE_URL` variable and links it to your service
3. No manual DB URL configuration needed!

### Step 4: Set Environment Variables

In your Railway backend service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(auto-provided by Railway PostgreSQL)* |
| `JWT_SECRET` | *(generate a random 64-char string)* |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://your-app.vercel.app` *(set after Vercel deploy)* |
| `SMTP_HOST` | `smtp.gmail.com` *(optional)* |
| `SMTP_PORT` | `587` *(optional)* |
| `SMTP_USER` | *your email* *(optional)* |
| `SMTP_PASS` | *your app password* *(optional)* |
| `SMTP_FROM` | `LastMile Delivery <noreply@lastmile.dev>` *(optional)* |
| `SMS_PROVIDER` | `console` |

> 💡 **Tip**: Generate a JWT secret with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 5: Configure Build & Start Commands

In Railway service → **Settings** tab:

- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npx prisma db push --accept-data-loss && npm start`
- **Root Directory**: `backend`

> These are also defined in `railway.toml` and `nixpacks.toml` — Railway will pick them up automatically.

### Step 6: Deploy

Click **Deploy** or push to `main` — Railway auto-deploys on every push.

### Step 7: Verify Backend

Once deployed, Railway provides a public URL like `https://lastmile-delivery-backend-production.up.railway.app`

Test health check:
```bash
curl https://YOUR-RAILWAY-URL/health
# → { "status": "ok", "service": "lastmile-delivery-backend" }
```

### Step 8: Seed Database (Optional)

To populate demo data (admin, agents, zones, rate cards), use Railway's CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed
railway run npm run prisma:seed
```

Or run it via Railway's shell in the dashboard.

---

## Part 2 — Frontend on Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects **Vite** — no extra framework config needed

### Step 2: Set Environment Variables

In Vercel → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL/api/v1` |

> ⚠️ Replace `YOUR-RAILWAY-URL` with the actual Railway backend URL from Part 1, Step 7.

### Step 3: Deploy

Click **Deploy**. Vercel will:
1. Run `npm install`
2. Run `tsc -b && vite build`
3. Serve the `dist/` folder with the SPA rewrites from `vercel.json`

### Step 4: Update Railway CORS

After Vercel deploys, go back to Railway and update:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://your-app.vercel.app` |

This ensures the backend accepts requests from your Vercel frontend.

---

## Post-Deployment Checklist

- [ ] Backend health check returns `200 OK` at `/health`
- [ ] Frontend loads at Vercel URL
- [ ] Login works (use seed credentials: `admin@lastmile.dev` / `password123`)
- [ ] Create an order end-to-end
- [ ] Agent can update order status
- [ ] Admin dashboard shows data

---

## Seed Credentials (if seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lastmile.dev` | `password123` |
| Agent (North) | `agent.north@lastmile.dev` | `password123` |
| Agent (South) | `agent.south@lastmile.dev` | `password123` |
| Agent (East) | `agent.east@lastmile.dev` | `password123` |
| Agent (West) | `agent.west@lastmile.dev` | `password123` |
| Customer | `customer@example.com` | `password123` |

---

## Custom Domains (Optional)

### Railway
1. Service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Add the CNAME record Railway provides to your DNS

### Vercel
1. Project → **Settings** → **Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow Vercel's DNS instructions

---

## Troubleshooting

### Backend won't start
- Check Railway logs for Prisma errors — usually means `DATABASE_URL` is missing
- Ensure PostgreSQL add-on is linked to the service

### Frontend shows "Network Error"
- Verify `VITE_API_URL` is set correctly in Vercel (include `/api/v1`)
- Verify `FRONTEND_URL` is set in Railway (for CORS)
- Redeploy frontend after changing env vars

### Prisma schema errors
- The production schema uses PostgreSQL enums. Don't mix with the SQLite schema
- For local dev with SQLite, use `npm run dev:local` in the backend

### "Cannot find module @prisma/client"
- Ensure `npx prisma generate` runs during build (it's in the build command)

---

## Architecture Diagram

```
┌─────────────────────┐         ┌───────────────────────────┐
│                     │  HTTPS  │                           │
│   Vercel            │────────▶│   Railway                 │
│   (React Frontend)  │         │   (Express Backend)       │
│                     │         │                           │
│   VITE_API_URL ─────│─────────│──▶ :4000/api/v1/*         │
│                     │         │                           │
└─────────────────────┘         │   ┌───────────────────┐   │
                                │   │  PostgreSQL        │   │
                                │   │  (Railway Add-on)  │   │
                                │   └───────────────────┘   │
                                └───────────────────────────┘
```
