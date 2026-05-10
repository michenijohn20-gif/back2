import { Router } from "express";
import { prisma } from "../prisma.js";
import { shippingRates, shippingAmountForCounty } from "../services/settings.js";
import { KENYAN_COUNTIES } from "../data/kenyanCounties.js";
import { isValidKenyaPhone } from "../utils/phone.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post("/quote", optionalAuth, async (req, res) => {
  const { county, items } = req.body || {};
  if (!county) return res.status(400).json({ error: "County required" });
  if (!Array.isArray(items)) return res.status(400).json({ error: "Items required" });
  try {
    const { subtotal, lines } = await computeLines(items);
    const rates = await shippingRates();
    const shippingAmount = shippingAmountForCounty(county, rates);
    res.json({
      subtotal,
      shippingAmount,
      totalAmount: subtotal + shippingAmount,
      countyValid: KENYAN_COUNTIES.includes(county),
      linesPreview: lines,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Could not calculate quote" });
  }
});

export async function computeLines(items) {
  let subtotal = 0;
  const lines = [];
  for (const row of items) {
    const { variantId, quantity, condition } = row;
    if (!variantId || !quantity || !condition) throw new Error("Each item needs variant, quantity, and condition");
    const qty = Math.max(1, Math.min(10, Number(quantity)));
    const cond = String(condition).toUpperCase();
    if (!["EXCELLENT", "GOOD", "FAIR"].includes(cond)) throw new Error("Invalid condition");

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });
    if (!variant) throw new Error("Variant not found");
    const unitPrice =
      cond === "GOOD"
        ? variant.priceGood
        : cond === "FAIR"
          ? variant.priceFair
          : variant.priceExcellent;
    const stockAvail =
      cond === "GOOD"
        ? variant.stockGood
        : cond === "FAIR"
          ? variant.stockFair
          : variant.stockExcellent;
    if (stockAvail < qty) throw new Error(`Insufficient stock for ${variant.product.name}`);

    subtotal += unitPrice * qty;
    const img = variant.product.images[0]?.url || "";
    lines.push({
      variantId,
      quantity: qty,
      condition: cond,
      unitPrice,
      productName: variant.product.name,
      brandName: variant.product.brand.name,
      variantLabel: [variant.storage, variant.color].filter(Boolean).join(" · ") || "Standard",
      imageUrl: img,
      productId: variant.productId,
    });
  }
  return { subtotal, lines };
}

export default router;
