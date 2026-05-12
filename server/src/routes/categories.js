import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, iconUrl: true },
    });
    res.json(categories);
  }),
);

export default router;
