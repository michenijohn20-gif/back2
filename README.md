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
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # mirrors server GOOGLE_CLIENT_ID
```

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
