# 🚀 Deploy Last Mile Delivery — Railway + Vercel

> **Backend** → Railway (Node.js + SQLite, auto-seeds on every deploy)
> **Frontend** → Vercel (Vite React SPA)

---

## Prerequisites

- [GitHub](https://github.com) account with this repo pushed
- [Railway](https://railway.app) account (free tier works)
- [Vercel](https://vercel.com) account (free tier works)

---

## How It Works

Railway uses an **ephemeral filesystem** — the SQLite database is recreated fresh on every deploy. The server automatically seeds all demo data (admin, agents, customer, zones, rate cards) on startup, so the app is always ready to use.

```
Deploy → prisma db push (creates tables) → npm start → autoSeed() → Server ready ✅
```

---

## Part 1 — Backend on Railway

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Railway + Vercel deployment with SQLite auto-seed"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Pick your repository
4. Set the **Root Directory** to `backend`

> ⚠️ **No database addon needed** — SQLite runs as a file inside the service.

### Step 3: Set Environment Variables

In your Railway backend service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `file:./dev.db` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate a random 64-char string)* |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://your-app.vercel.app` *(set after Vercel deploy)* |
| `SMS_PROVIDER` | `console` |

> 💡 Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

> 📧 SMTP variables are optional — notifications log to console if not set.

### Step 4: Deploy

Railway auto-deploys on push. The build/start commands are defined in `railway.toml`:
- **Build**: `npm install && npx prisma generate && npm run build`
- **Start**: `npx prisma db push && npm start`

### Step 5: Verify Backend

Railway provides a public URL. Test it:
```bash
curl https://YOUR-RAILWAY-URL/health
# → { "status": "ok", "service": "lastmile-delivery-backend" }
```

Check Railway logs — you should see:
```
🌱 Fresh database detected — seeding demo data...
  ✓ Admin created: admin@lastmile.dev
  ✓ 4 zones created
  ✓ Zone area mappings created
  ✓ 4 agents created
  ✓ Rate cards created
  ✓ COD surcharge configs created
  ✓ Demo customer created
  ✓ 3 saved addresses created
✅ Auto-seed completed successfully!
🚀 LastMile Delivery API server running on 0.0.0.0:4000
```

---

## Part 2 — Frontend on Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Vercel auto-detects Vite

### Step 2: Set Environment Variables

In Vercel → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL/api/v1` |

> Replace `YOUR-RAILWAY-URL` with the Railway backend URL from Part 1.

### Step 3: Deploy

Click **Deploy**. Vercel runs `tsc -b && vite build` and serves the SPA.

### Step 4: Update Railway CORS

Go back to Railway and set:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://your-app.vercel.app` |

---

## Login Credentials

All passwords are `password123`

| Role | Email |
|------|-------|
| Admin | `admin@lastmile.dev` |
| Agent (North) | `agent.north@lastmile.dev` |
| Agent (South) | `agent.south@lastmile.dev` |
| Agent (East) | `agent.east@lastmile.dev` |
| Agent (West) | `agent.west@lastmile.dev` |
| Customer | `customer@example.com` |

---

## Important Notes

### Data Persistence
- SQLite data **resets on every deploy** — this is by design for a demo app
- All demo data is re-created automatically via `autoSeed()`
- Any orders/data created between deploys will be lost

### Custom Domains (Optional)

**Railway**: Service → Settings → Networking → Custom Domain
**Vercel**: Project → Settings → Domains

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Health check fails | Check Railway logs for errors. Ensure `DATABASE_URL=file:./dev.db` is set |
| Frontend "Network Error" | Verify `VITE_API_URL` includes `/api/v1`. Redeploy frontend after changing env vars |
| CORS errors | Set `FRONTEND_URL` in Railway to your Vercel URL |
| Login doesn't work | Check Railway logs for seed output. The auto-seed runs on first startup |
