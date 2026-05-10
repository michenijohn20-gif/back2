import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireUser } from "../middleware/authUser.js";

const router = Router();
router.use(requireUser);

router.get("/", async (req, res) => {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true, url: true, sortOrder: true } },
          variants: {
            select: {
              id: true,
              storage: true,
              color: true,
              priceExcellent: true,
              priceGood: true,
              priceFair: true,
              stockExcellent: true,
              stockGood: true,
              stockFair: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map((w) => w.product));
});

router.post("/:productId", async (req, res) => {
  const productId = req.params.productId;
  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) return res.status(404).json({ error: "Product not found" });
  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId: req.user.id, productId },
    },
    create: { userId: req.user.id, productId },
    update: {},
  });
  res.status(201).json({ ok: true });
});

router.delete("/:productId", async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });
  res.json({ ok: true });
});

export default router;
