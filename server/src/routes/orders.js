import { Router } from "express";
import { prisma } from "../prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { isValidKenyaPhone } from "../utils/phone.js";
import { KENYAN_COUNTIES } from "../data/kenyanCounties.js";
import { shippingRates, shippingAmountForCounty } from "../services/settings.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { computeLines } from "./checkout.js";
import { sendOrderEmails } from "../services/email.js";
import { PaymentMethod, PaymentStatus, OrderFulfillmentStatus } from "@prisma/client";

const router = Router();

router.get("/status/:orderNumber", async (req, res) => {
  const ord = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    select: { orderNumber: true, paymentStatus: true, fulfillmentStatus: true, totalAmount: true },
  });
  if (!ord) return res.status(404).json({ error: "Not found" });
  res.json(ord);
});

router.post("/", optionalAuth, async (req, res) => {
  const body = req.body || {};
  const {
    email,
    fullName,
    phone,
    county,
    townArea,
    building,
    street,
    deliveryMethod,
    paymentMethod,
    items,
  } = body;

  if (!email || !fullName || !phone || !county || !townArea) {
    return res.status(400).json({ error: "Contact and delivery fields are required" });
  }
  if (!isValidKenyaPhone(phone)) return res.status(400).json({ error: "Invalid Kenyan phone number" });
  if (!KENYAN_COUNTIES.includes(county)) return res.status(400).json({ error: "Invalid county" });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Cart is empty" });

  const pm =
    String(paymentMethod).toUpperCase() === "CARD" ? PaymentMethod.CARD : PaymentMethod.MPESA;
  if (!["MPESA", "CARD"].includes(String(paymentMethod).toUpperCase())) {
    return res.status(400).json({ error: "Invalid payment method" });
  }

  try {
    const { subtotal, lines } = await computeLines(items);
    const rates = await shippingRates();
    const shippingAmount = shippingAmountForCounty(county, rates);
    const totalAmount = subtotal + shippingAmount;

    const orderNumber = generateOrderNumber();
    const userId = req.userId || null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        guestEmail: String(email).toLowerCase(),
        guestName: fullName,
        guestPhone: phone,
        paymentMethod: pm,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
        subtotal,
        shippingAmount,
        totalAmount,
        deliveryCounty: county,
        deliveryTown: townArea,
        deliveryBuilding: building || null,
        deliveryStreet: street || null,
        shippingMethod: deliveryMethod || (county === "Nairobi" ? "Nairobi (KES 350)" : "Rest of Kenya (KES 600)"),
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            condition: l.condition,
            productName: l.productName,
            brandName: l.brandName,
            variantLabel: l.variantLabel,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            imageUrl: l.imageUrl || null,
          })),
        },
      },
      include: { items: true },
    });

    const responseOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        user: { select: { email: true, fullName: true } },
      },
    });

    res.status(201).json(responseOrder);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || "Could not create order" });
  }
});

router.get("/paid/:orderNumber", async (req, res) => {
  const ord = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: {
      items: true,
      user: { select: { email: true, fullName: true } },
    },
  });
  if (!ord) return res.status(404).json({ error: "Not found" });
  const email = req.query.email?.toLowerCase?.();
  if (ord.paymentStatus !== PaymentStatus.PAID) return res.status(403).json({ error: "Not confirmed" });
  if (email && email !== ord.guestEmail && email !== ord.user?.email?.toLowerCase()) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(ord);
});

export async function markOrderPaid(orderId, extra = {}) {
  const ord = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!ord || ord.paymentStatus === PaymentStatus.PAID) return ord;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus:
          ord.fulfillmentStatus === OrderFulfillmentStatus.PROCESSING
            ? OrderFulfillmentStatus.CONFIRMED
            : ord.fulfillmentStatus,
        ...extra,
      },
    });
    for (const item of ord.items) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId || "" } });
      if (!variant) continue;
      const cond = String(item.condition);
      const field =
        cond === "GOOD" ? "stockGood" : cond === "FAIR" ? "stockFair" : "stockExcellent";
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { [field]: { decrement: item.quantity } },
      });
    }
  });

  const fresh = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { email: true, fullName: true } } },
  });
  await sendOrderEmails({ order: fresh, items: fresh.items });
  return fresh;
}

export default router;

// markOrderPaid exported for payments route
