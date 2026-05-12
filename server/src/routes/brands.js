import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

let cachedBrands = null;
let cachedBrandsExpiresAt = 0;

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    if (cachedBrands && Date.now() < cachedBrandsExpiresAt) {
      return res.json(cachedBrands);
    }

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    cachedBrands = brands;
    cachedBrandsExpiresAt = Date.now() + 5 * 60_000;
    res.json(brands);
  }),
);

export default router;
