import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

function buildVariantAnd(conditionRaw, priceMin, priceMax, inStockRaw, storage, color) {
  const condition = String(conditionRaw || "EXCELLENT").toUpperCase();
  const priceKey =
    condition === "GOOD" ? "priceGood" : condition === "FAIR" ? "priceFair" : "priceExcellent";
  const stockKey =
    condition === "GOOD" ? "stockGood" : condition === "FAIR" ? "stockFair" : "stockExcellent";

  const parts = [];
  if (storage) {
    parts.push({ storage: { contains: String(storage), mode: "insensitive" } });
  }
  if (color) {
    parts.push({ color: { contains: String(color), mode: "insensitive" } });
  }
  if (priceMin != null && priceMin !== "") {
    parts.push({ [priceKey]: { gte: Number(priceMin) } });
  }
  if (priceMax != null && priceMax !== "") {
    parts.push({ [priceKey]: { lte: Number(priceMax) } });
  }
  if (inStockRaw === "true" || inStockRaw === true) {
    parts.push({ [stockKey]: { gt: 0 } });
  }
  return parts;
}

router.get("/", asyncHandler(async (req, res) => {
  const {
    q,
    featured,
    categories,
    brands,
    condition,
    priceMin,
    priceMax,
    storage,
    color,
    inStock,
    page = "1",
    pageSize = "12",
    sort = "featured",
  } = req.query;

  const take = Math.min(48, Math.max(1, Number(pageSize) || 12));
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;

  const catSlugs = categories
    ? String(categories)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const brandSlugs = brands
    ? String(brands)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const variantAnd = buildVariantAnd(condition, priceMin, priceMax, inStock, storage, color);

  const and = [];

  // Case-insensitive slug match (Supabase / manual imports often differ in casing from seed URLs)
  if (catSlugs.length) {
    and.push({
      OR: catSlugs.map((slug) => ({
        category: { slug: { equals: slug, mode: "insensitive" } },
      })),
    });
  }
  if (brandSlugs.length) {
    and.push({
      OR: brandSlugs.map((slug) => ({
        brand: { slug: { equals: slug, mode: "insensitive" } },
      })),
    });
  }
  if (featured === "true") and.push({ featured: true });
  if (q) {
    and.push({
      OR: [
        { name: { contains: String(q), mode: "insensitive" } },
        { brand: { name: { contains: String(q), mode: "insensitive" } } },
      ],
    });
  }
  if (variantAnd.length) {
    and.push({ variants: { some: { AND: variantAnd } } });
  }

  const where = and.length ? { AND: and } : {};

  let orderBy;
  if (sort === "newest") orderBy = { createdAt: "desc" };
  else if (sort === "featured" || sort === "") orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
  else orderBy = { createdAt: "desc" }; // placeholder; price sorts happen in-memory below

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
      },
    }),
  ]);

  const cond = String(condition || "EXCELLENT").toUpperCase();
  const products = rows.map((p) => {
    const variants = p.variants || [];
    let minP = Infinity;
    let maxP = -Infinity;
    let anyStock = false;
    for (const v of variants) {
      const pr = cond === "GOOD" ? v.priceGood : cond === "FAIR" ? v.priceFair : v.priceExcellent;
      const st = cond === "GOOD" ? v.stockGood : cond === "FAIR" ? v.stockFair : v.stockExcellent;
      if (typeof pr === "number") {
        minP = Math.min(minP, pr);
        maxP = Math.max(maxP, pr);
      }
      if (st > 0) anyStock = true;
    }
    const defaultVariant = variants[0];
    const specLine = [defaultVariant?.storage, defaultVariant?.color].filter(Boolean).join(" · ");
    return {
      ...p,
      displayPrice: Number.isFinite(minP) ? minP : 0,
      displayPriceMax: Number.isFinite(maxP) ? maxP : 0,
      specLine,
      inStockAggregate: anyStock,
    };
  });

  if (sort === "price_asc") {
    products.sort((a, b) => a.displayPrice - b.displayPrice);
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.displayPrice - a.displayPrice);
  }

  res.json({ total, page: Number(page), pageSize: take, products });
}));

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        reviews: {
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true } } },
        },
      },
    });
    if (!product) return res.status(404).json({ error: "Not found" });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
      },
    });

    res.json({ product, related });
  }),
);

export default router;
