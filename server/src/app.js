import express from "express";
import cors from "cors";
import "dotenv/config";

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

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
        : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "4mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, name: "RefurbKE API" }));

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
    res.status(500).json({ error: err.message || "Server error" });
  });

  return app;
}
