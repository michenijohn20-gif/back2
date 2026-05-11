import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../util/asyncHandler.js";

const router = Router();

function imageColorFromUrl(url = "") {
  const match = String(url).match(/^\s*([^|]+)\s*\|\s*(https?:\/\/.+)$/i);
  return match ? match[1].trim() : null;
}

function cleanImageUrl(url = "") {
  const match = String(url).match(/^\s*([^|]+)\s*\|\s*(https?:\/\/.+)$/i);
  return (match ? match[2] : url).trim();
}

function normalizeProductImages(product) {
  if (!product?.images) return product;
  return {
    ...product,
    images: product.images.map((img) => ({
      ...img,
      url: cleanImageUrl(img.url),
      color: imageColorFromUrl(img.url),
    })),
  };
}

function priceForCondition(variant, condition) {
  if (!variant) return 0;
  const cond = String(condition || "EXCELLENT").toUpperCase();
  return cond === "GOOD" ? variant.priceGood : cond === "FAIR" ? variant.priceFair : variant.priceExcellent;
}

function stockForCondition(variant, condition) {
  if (!variant) return 0;
  const cond = String(condition || "EXCELLENT").toUpperCase();
  return cond === "GOOD" ? variant.stockGood : cond === "FAIR" ? variant.stockFair : variant.stockExcellent;
}

function listingPriceOptions(variants = []) {
  return variants.flatMap((variant) =>
    ["EXCELLENT", "GOOD", "FAIR"].map((condition) => ({
      variant,
      condition,
      price: priceForCondition(variant, condition),
      stock: stockForCondition(variant, condition),
    })),
  );
}

function cheapestListingOption(variants = []) {
  const options = listingPriceOptions(variants).filter((option) => option.price > 0);
  return (
    options
      .filter((option) => option.stock > 0)
      .sort((a, b) => a.price - b.price)[0] || options.sort((a, b) => a.price - b.price)[0]
  );
}

function maxListingPrice(variants = []) {
  const options = listingPriceOptions(variants).filter((option) => option.price > 0);
  const stockedOptions = options.filter((option) => option.stock > 0);
  const source = stockedOptions.length ? stockedOptions : options;
  return source.reduce((max, option) => Math.max(max, option.price), 0);
}

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
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
};

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

  const priceSort = sort === "price_asc" || sort === "price_desc";
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: priceSort ? undefined : skip,
      take: priceSort ? undefined : take,
      orderBy,
      select: productCardSelect,
    }),
  ]);

  const products = rows.map((row) => {
    const p = normalizeProductImages(row);
    const variants = p.variants || [];
    const cheapest = cheapestListingOption(variants);
    const sortedVariants = [...variants].sort((a, b) => {
      const aPrice = cheapestListingOption([a])?.price || 0;
      const bPrice = cheapestListingOption([b])?.price || 0;
      return aPrice - bPrice;
    });
    const defaultVariant = cheapest?.variant || sortedVariants[0];
    const specLine = [defaultVariant?.storage, defaultVariant?.color].filter(Boolean).join(" · ");
    return {
      ...p,
      variants: sortedVariants,
      displayPrice: cheapest?.price || 0,
      displayCondition: cheapest?.condition || "EXCELLENT",
      displayPriceMax: maxListingPrice(variants),
      specLine,
      inStockAggregate: listingPriceOptions(variants).some((option) => option.stock > 0),
    };
  });

  if (sort === "price_asc") {
    products.sort((a, b) => a.displayPrice - b.displayPrice);
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.displayPrice - a.displayPrice);
  }

  const pagedProducts = priceSort ? products.slice(skip, skip + take) : products;

  res.json({ total, page: Number(page), pageSize: take, products: pagedProducts });
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
      select: productCardSelect,
    });

    const normalizedProduct = normalizeProductImages(product);
    normalizedProduct.variants = [...(normalizedProduct.variants || [])].sort(
      (a, b) => priceForCondition(a, "EXCELLENT") - priceForCondition(b, "EXCELLENT"),
    );

    res.json({
      product: normalizedProduct,
      related: related.map(normalizeProductImages),
    });
  }),
);

export default router;
