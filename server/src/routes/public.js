import { Router } from "express";
import { KENYAN_COUNTIES } from "../data/kenyanCounties.js";
import { shippingRates } from "../services/settings.js";

const router = Router();

router.get("/counties", (_req, res) => res.json(KENYAN_COUNTIES));

router.get("/shipping-rates", async (_req, res) => {
  const r = await shippingRates();
  res.json(r);
});

export default router;
