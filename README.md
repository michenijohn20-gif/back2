# RefurbKE

Full-stack React + Express refurbishment marketplace tailored for Kenyan buyers (`/client` + `/server`).

## Stack

| Area | Detail |
| --- | --- |
| Frontend | Vite · React 18 · React Router 6 · Tailwind CSS · Zustand · Axios · React Helmet Async |
| Backend | Express (ESM) · Prisma 6 · PostgreSQL |
| Auth | JWT (customers) · dedicated admin JWT (`ADMIN_JWT_SECRET`) |
| Media | Cloudinary uploads via admin `/api/admin/upload` |
| Email | Nodemailer (transactional confirmations when SMTP is configured) |
| Payments | Safaricom Daraja STK Push + Pesapal iframe (sandbox/live URLs via env) |

## Prerequisites

- Node.js ≥ 18
- PostgreSQL 14+
- Accounts for Daraja / Pesapal / Cloudinary when you graduate beyond localhost

## 1. Prepare the database

```bash
cd /home/dwayne/back2/server
cp .env.example .env            # populate DATABASE_URL and secrets
npm install
npm run db:push                 # prisma db push against your Postgres
npm run db:seed                 # inserts categories, brands, 24 Kenyan-market products, demo users
```

Seed highlights:

| Login | Password | Role |
| --- | --- | --- |
| admin@refurbke.ke | admin123 | Admin dashboard |
| winnie@example.co.ke | buyer123 | Demo customer |

## 2. Run the API

```bash
cd /home/dwayne/back2/server
npm run dev                     # listens on PORT (default 4000)
```

### Supabase / Postgres connection issues

Use a **direct** Postgres URL (Supabase → Project Settings → Database). Append SSL when required:

`postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require`

Then run `npx prisma db push` so Prisma creates tables **`Category`**, **`Product`**, etc. (If you only created custom tables in the SQL editor, names must match Prisma’s models or queries will 500.)

**Debug:** open `http://localhost:4000/api/health/db` — if this fails, fix `DATABASE_URL` before the storefront can load categories/products.

After pulling the latest server code, failed API routes return JSON with Prisma **`code`** / **`meta`** in development to speed up debugging.

Expose a public HTTPS URL when testing STK callbacks; set:

- `MPESA_CALLBACK_URL` → `POST` target at `/api/payments/mpesa/callback`
- `SERVER_PUBLIC_URL` → base URL echoed in tooling/docs (optional helper)

Daraja essentials live in `.env`:

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE` (Paybill/Till/Business short code)
- `MPESA_PASSKEY`
- Toggle `MPESA_ENV` between `sandbox` and `production`
- Sandbox test numbers are documented inside the Safaricom developer portal (`https://developer.safaricom.co.ke`)

**STK checklist**

1. Create an app, enable Lipa Na M-Pesa Online (STK Push) on sandbox.
2. Whitelist your outbound IP if required by Safaricom.
3. Paste callback URL reachable from Safaricom.
4. The checkout UI polls `/api/payments/mpesa/status/:orderNumber` every five seconds after STK initiation (server queries `stkpushquery`).

Pesapal v3 essentials:

```
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3/api   # or live https://pay.pesapal.com/v3/api
PESAPAL_IPN=                                                # HTTPS IPN endpoint registered inside Pesapal
```

## 3. Run the storefront

```bash
cd /home/dwayne/back2/client
cp .env.example .env           # defaults target http://localhost:4000 via Vite proxy when empty
npm install
npm run dev                    # opens http://localhost:5173
```

Optional overrides:

```
# Local: omit VITE_API_URL to use the Vite dev proxy.
# Production: set to your public API origin (see “Netlify” below).
VITE_API_URL=https://your-api.example.com
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # mirrors server GOOGLE_CLIENT_ID
```

## Netlify (frontend only)

**Full Railway API guide:** [docs/deploy-railway.md](docs/deploy-railway.md)

Netlify serves **static files** from `client/dist`. It does **not** run your Express + Prisma server, so the catalogue will stay empty until the browser can reach a live API.

1. **Deploy the API** somewhere that runs Node 18+ long-lived (e.g. [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), a VPS). Set `DATABASE_URL` (Supabase), `JWT_SECRET`, `CLIENT_URL`, etc., on that host. Start command: `node server/src/index.js` or `npm start` from `/server` after `npx prisma generate` and `prisma migrate deploy` / `db push`.
2. **CORS:** In the API `.env`, set `CLIENT_URL` to your Netlify site, e.g. `https://refurbke.netlify.app` (comma-separate if you have preview URLs too).
3. **Netlify environment variables:** Add `VITE_API_URL` = `https://your-api-host.example.com` (**no trailing slash**). Redeploy so Vite bakes it into the bundle.
4. **Build:** Repo includes `netlify.toml` (`cd client && npm install && npm run build`, publish `client/dist`). Or set the same in the Netlify UI.

Smoke-test the API from your machine: `curl https://your-api-host.example.com/api/categories`

## 4. Admin workspace

Navigate to `/admin/login` with the seeded admin account. Administrators edit catalog metadata, shipments, KPIs, and store configuration blobs.

> **Operational note**: payment gateway secrets should remain in `.env`. The `/admin/settings` screen mirrors optional metadata for onboarding but the processors still prefer environment variables configured on the VPS.

## 📁 Useful scripts

```bash
# server/
npm run dev            # nodemon-like watch via node --watch
npm run db:migrate     # prisma migrate dev (optional once schema stabilises)

# client/
npm run build          # production bundle inside client/dist
```

## 🧭 Application map

| Path | Purpose |
| --- | --- |
| `/` | Back Market-inspired hero, trust strip, category grid, featured products |
| `/products` | Listing with filters drawer (mobile), pagination |
| `/products/:slug` | PDP with refurbishment tabs, galleries, specs |
| `/search` | Mirrors listing with search headline |
| `/cart` · `/checkout` | Zustand cart + Kenyan delivery wizard + STK/Pesapal orchestration |
| `/account/*` | Orders (with timelines), wishlist, profile, addresses, password |
| `/admin/*` | KPI dashboard, fulfilment tooling, catalogue tools |

## ⚠️ Production hardening backlog

Replace placeholder social URLs, tighten CORS origins, terminate TLS via your edge proxy, persist uploaded assets only through Cloudinary, and monitor Daraja callbacks for forged traffic.
