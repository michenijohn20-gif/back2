import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    res.json(brands);
  }),
);

export default router;
