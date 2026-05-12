import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

let cachedCategories = null;
let cachedCategoriesExpiresAt = 0;

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    if (cachedCategories && Date.now() < cachedCategoriesExpiresAt) {
      return res.json(cachedCategories);
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, iconUrl: true },
    });
    cachedCategories = categories;
    cachedCategoriesExpiresAt = Date.now() + 5 * 60_000;
    res.json(categories);
  }),
);

export default router;
