# Deploy RefurbKE API to Railway (free tier)

Netlify only hosts the **React app**. Railway runs the **Express + Prisma API** so `/api/products`, `/api/categories`, checkout, and auth work in production.

---

## 0. What you need before starting

- GitHub repo pushed with this project (`client/` + `server/`).
- **Supabase** (or any Postgres) with connection string for `DATABASE_URL`.
- **Netlify** (or other static host) for the frontend — you will set `VITE_API_URL` to your Railway URL after step 4.

**Railway free tier notes (as of 2025–2026):** plans change often. The free trial / hobby tier may sleep services or have usage limits. Check [railway.app/pricing](https://railway.app/pricing). For always-on or predictable billing, budget a small paid plan later.

---

## 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub is easiest).
2. **New Project** → **Deploy from GitHub repo** → select `back2` (or your repo name).
3. Railway may auto-add a service — **delete** the default if it used the repo root, or we’ll reconfigure it below.

---

## 2. Monorepo: how Railway finds the API

Your repo has **`client/`** and **`server/`** at the top level. Railway’s builder (Railpack / Nixpacks) looks for a **`package.json` at the root**. If there isn’t one, the build fails with **“railpack process exited with an error”** after listing `client/` and `server/`.

You can fix it in **either** way:

### Option A — Recommended: set Root Directory to `server`

1. Open the **back2** service → **Settings**.
2. **Root Directory** → **`server`** (save).
3. **Clear** any custom Build/Start overrides so Railway uses `server/package.json` defaults, **or** set explicitly:

| Field | Value |
|--------|--------|
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |

### Option B — Leave Root Directory empty (repo root)

This repo includes a **root `package.json`** whose `build` / `start` scripts `cd server && …`. With an **empty** Root Directory:

- Railway runs **`npm install`** at root (no root deps — fast).
- Then **`npm run build`** → installs server deps + `prisma generate`.
- Then **`npm start`** → runs the API.

You usually **do not** need to set custom Build/Start commands unless Railway doesn’t pick them up (then set Build to `npm run build`, Start to `npm start`).

---

## 3. Build and start commands (summary)

| Layout | Build Command | Start Command |
|--------|----------------|---------------|
| **Root Directory = `server`** | `npm install && npx prisma generate` | `npm start` |
| **Root = repo root** (Option B) | `npm run build` (or leave default) | `npm start` |

- `npm start` runs `node src/index.js` inside `server/`, using `process.env.PORT` (Railway sets `PORT` automatically).

**If you use Prisma migrations** (you have `prisma/migrations` and use `migrate deploy` in prod):

```text
npm install && npx prisma generate && npx prisma migrate deploy
```

If you only ever used `prisma db push` locally, first deploy schema to production DB once (see §6), or add `migrate deploy` after you create migrations.

---

## 4. Environment variables (Railway → Variables)

Add these in Railway **Variables** (same names as `server/.env.example`). **Never commit real secrets** to Git.

### Required

| Variable | Example / notes |
|----------|------------------|
| `DATABASE_URL` | Supabase **URI** from Project Settings → Database. Use **Session mode** or **Direct** as Prisma docs recommend. Often append `?sslmode=require`. For **Supavisor pooler**, you may need `?pgbouncer=true&connection_limit=1` — see [Prisma + PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-prisma-with-pgbouncer). |
| `JWT_SECRET` | Long random string. |
| `JWT_REFRESH_SECRET` | Different long random string. |
| `CLIENT_URL` | Your **Netlify** site URL, e.g. `https://refurbke.netlify.app`. For local + prod: `https://refurbke.netlify.app,http://localhost:5173` (comma-separated, no spaces — matches your `server/src/app.js` CORS split). |

### Strongly recommended

| Variable | Notes |
|----------|--------|
| `ADMIN_JWT_SECRET` | Separate secret for `/api/admin` JWT. |
| `NODE_ENV` | `production` |

### Payments / email / uploads (when ready)

- `MPESA_*`, `PAYSTACK_*`, `SMTP_*`, `CLOUDINARY_*`, `GOOGLE_*`, `ADMIN_NOTIFICATION_EMAIL`, etc., as in `.env.example`.

**M-Pesa callback:** After first deploy, copy your public Railway URL (e.g. `https://refurbke-production.up.railway.app`) and set:

- `MPESA_CALLBACK_URL=https://YOUR-SUBDOMAIN.up.railway.app/api/payments/mpesa/callback`
- `SERVER_PUBLIC_URL` to the same origin (no path)

Redeploy after changing variables.

---

## 5. First deploy

1. **Deploy** (or push to the branch Railway watches).
2. Open **Deployments** logs: build should finish with Prisma Client generated; start should show `listening on …`.
3. Railway assigns a URL like `https://something.up.railway.app` (**Settings** → **Networking** → **Generate Domain** if needed).

### Smoke tests (replace with your URL)

```bash
curl https://YOUR-SUBDOMAIN.up.railway.app/
curl https://YOUR-SUBDOMAIN.up.railway.app/api/health
curl https://YOUR-SUBDOMAIN.up.railway.app/api/health/db
curl https://YOUR-SUBDOMAIN.up.railway.app/api/categories
```

- If `/api/health/db` fails → fix `DATABASE_URL` (SSL, host, password).
- If `/api/categories` is `[]` or errors → schema not applied or wrong DB (§6).

---

## 6. Database schema on Supabase (one-time)

From your **laptop** (with `DATABASE_URL` pointing at the **same** Supabase DB Railway uses):

```bash
cd server
cp .env.example .env   # put real DATABASE_URL in .env
npx prisma db push      # or: npx prisma migrate deploy
npm run db:seed         # optional: demo products + admin user
```

Or use **Railway CLI** one-off:

```bash
railway link
railway run --service YOUR_SERVICE_NAME npx prisma db push
railway run --service YOUR_SERVICE_NAME npm run db:seed
```

**Important:** The tables must match `server/prisma/schema.prisma`. Data you created only in Supabase SQL must use the same table/column names Prisma expects (`Category`, `Product`, etc.).

---

## 7. Point Netlify at Railway

1. Netlify → **Site settings** → **Environment variables**.
2. Add: `VITE_API_URL` = `https://YOUR-SUBDOMAIN.up.railway.app` (**no trailing slash**).
3. **Trigger deploy** (rebuild) so Vite embeds `VITE_API_URL`.

Open your Netlify site: catalogue should load if CORS `CLIENT_URL` includes that Netlify URL.

---

## 8. Custom domain (optional)

- **Railway:** add your domain in **Networking** and set DNS per Railway’s instructions.
- Update `CLIENT_URL`, `MPESA_CALLBACK_URL`, `SERVER_PUBLIC_URL`, and `VITE_API_URL` if the public API URL changes.
- **Netlify:** your site URL may stay `*.netlify.app` unless you add a custom domain there too — keep `CLIENT_URL` in sync with the **browser origin** users actually use.

---

## 9. Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Netlify site: empty catalogue, CORS errors | `CLIENT_URL` on Railway includes exact Netlify origin; `VITE_API_URL` matches Railway URL; redeploy Netlify after env change. |
| 503 on `/api/health/db` | `DATABASE_URL`, SSL, Supabase project paused, IP allowlist. |
| 500 on `/api/*` with Prisma code | Logs in Railway; run `prisma db push` / migrations against production DB. |
| M-Pesa callback never hits | Daraja dashboard callback URL must be HTTPS and match Railway; service must be awake when Safaricom calls. |

---

## 10. Security checklist

- Rotate any secrets that ever appeared in Git or screenshots.
- Use Railway **Variables** only for production secrets.
- Restrict Supabase **RLS** / credentials if you exposed the DB publicly.

---

## Quick reference: monorepo layout

```text
back2/
  client/          → Netlify (static)
  server/          → Railway (Root Directory = server)
  docs/deploy-railway.md
```
