import express from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./prisma.js";

import publicRouter from "./routes/public.js";
import categoriesRouter from "./routes/categories.js";
import brandsRouter from "./routes/brands.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import checkoutRouter from "./routes/checkout.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import addressesRouter from "./routes/addresses.js";
import wishlistRouter from "./routes/wishlist.js";
import accountRouter from "./routes/account.js";
import adminRouter from "./routes/admin.js";

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

function allowedCorsOrigins() {
  return (process.env.CLIENT_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const clean = normalizeOrigin(origin);
  const allowed = allowedCorsOrigins();
  if (!allowed.length) return true;
  if (allowed.includes(clean)) return true;

  return allowed.some((base) => {
    try {
      const baseUrl = new URL(base);
      const originUrl = new URL(clean);
      return (
        baseUrl.hostname.endsWith(".netlify.app") &&
        originUrl.hostname.endsWith(`--${baseUrl.hostname}`)
      );
    } catch {
      return false;
    }
  });
}

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin(origin, cb) {
        cb(null, isAllowedOrigin(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, name: "RefurbKE API" }));

  /** Confirms Prisma can reach Postgres (Supabase). Use when /api/categories returns 500. */
  app.get("/api/health/db", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, database: "reachable" });
    } catch (e) {
      console.error("[health/db]", e);
      res.status(503).json({
        ok: false,
        database: "error",
        message: e.message || "Database unreachable",
        hint:
          "Check DATABASE_URL (Supabase often needs ?sslmode=require). Run: npx prisma db push",
      });
    }
  });

  app.get("/", (_req, res) => {
    const storefronts = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    res.json({
      name: "RefurbKE API",
      message:
        "This URL is the JSON API only. Open your Netlify (or other) frontend in the browser to shop — not this Railway host.",
      storefronts: storefronts.length ? storefronts : ["(set CLIENT_URL on Railway to your Netlify URL, e.g. https://yoursite.netlify.app)"],
      api: ["/api/health", "/api/health/db", "/api/categories"],
    });
  });

  app.use("/api", publicRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/addresses", addressesRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/admin", adminRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    const dev = process.env.NODE_ENV !== "production";
    const body = {
      error: err.message || "Server error",
      ...(dev && err.code ? { code: err.code } : {}),
      ...(dev && err.meta ? { meta: err.meta } : {}),
    };
    res.status(500).json(body);
  });

  return app;
}
