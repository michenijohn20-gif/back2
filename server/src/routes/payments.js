import { Router } from "express";
import { prisma } from "../prisma.js";
import {
  stkPush,
  queryStkCheckout,
  mapStkQueryToPaid,
} from "../services/mpesa.js";
import { formattedForMpesa, isValidKenyaPhone } from "../utils/phone.js";
import { markOrderFailed, markOrderPaid } from "./orders.js";
import { OrderFulfillmentStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import axios from "axios";

const router = Router();

const paystackBaseUrl = "https://api.paystack.co";

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack secret key missing. Add PAYSTACK_SECRET_KEY.");
  return key;
}

function paystackHeaders() {
  return {
    Authorization: `Bearer ${getPaystackSecretKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function paystackReference(orderNumber) {
  return `RK-${orderNumber.replace(/[^a-zA-Z0-9=. -]/g, "").replace(/\s+/g, "")}-${Date.now()}`;
}

async function verifyPaystackReference(reference) {
  const { data } = await axios.get(
    `${paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders() },
  );
  return data?.data;
}

function paystackStatusKind(tx) {
  const status = String(tx?.status || "").toLowerCase();
  if (status === "success") return "paid";
  if (["failed", "abandoned", "reversed"].includes(status)) return "failed";
  return "pending";
}

async function syncPaystackOrder(order, reference) {
  const tx = await verifyPaystackReference(reference);
  const kind = paystackStatusKind(tx);

  if (kind === "paid") {
    await markOrderPaid(order.id, {
      pesapalOrderId: reference,
    });
  } else if (kind === "failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        pesapalOrderId: reference,
        adminNotes: [
          order.adminNotes,
          `[PAYSTACK_FAIL:${reference}] ${new Date().toISOString()} ${tx?.gateway_response || "Card payment was not completed."}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
  }

  return { kind, tx };
}

router.post("/mpesa/stk-push", async (req, res) => {
  const { orderId, phone } = req.body || {};
  if (!orderId || !phone) return res.status(400).json({ error: "orderId and phone required" });
  if (!isValidKenyaPhone(phone)) return res.status(400).json({ error: "Invalid Kenyan phone number" });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== PaymentMethod.MPESA) {
    return res.status(400).json({ error: "Invalid order for M-Pesa" });
  }
  if (![PaymentStatus.PENDING, PaymentStatus.FAILED].includes(order.paymentStatus)) {
    return res.status(400).json({ error: "Order payment already finalized" });
  }
  if (order.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED) {
    return res.status(400).json({
      error: "This order was cancelled after failed M-Pesa attempts. Please create a new order.",
    });
  }

  try {
    const phone254 = formattedForMpesa(phone);
    const resp = await stkPush({
      amount: order.totalAmount,
      phone254,
      accountReference: order.orderNumber.replace(/-/g, "").slice(0, 12),
      transactionDesc: `RK`,
    });

    const checkoutId = resp?.CheckoutRequestID;
    const merchantReq = resp?.MerchantRequestID;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpesaCheckoutId: checkoutId || merchantReq || null,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    const code = resp?.ResponseCode ?? resp?.responseCode;
    const success =
      code === "0" || code === 0 || `${code}` === "0" || `${resp?.errorCode ?? ""}` === "0";

    if (!success && resp?.ResponseDescription && resp?.CustomerMessage) {
      return res.status(400).json({ error: resp.CustomerMessage || resp.ResponseDescription });
    }

    res.json({
      checkoutRequestId: checkoutId,
      merchantRequestId: merchantReq,
    });
  } catch (e) {
    console.error("STK:", e.response?.data || e.message);
    res.status(500).json({
      error:
        e.response?.data?.errorMessage ||
        e.response?.data?.errorMessage ||
        e.message ||
        "Could not initiate M-Pesa",
    });
  }
});

router.get("/mpesa/status/:orderNumber", async (req, res) => {
  const ord = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
  if (!ord) return res.status(404).json({ status: "not_found" });

  if (ord.paymentStatus === PaymentStatus.PAID) {
    return res.json({ status: "paid", orderNumber: ord.orderNumber, orderId: ord.id });
  }
  if (ord.paymentStatus === PaymentStatus.FAILED) {
    const cancelled = ord.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED;
    return res.json({
      status: cancelled ? "cancelled" : "failed",
      orderNumber: ord.orderNumber,
      detail: cancelled
        ? "Order cancelled after failed M-Pesa attempts. Please create a new order."
        : "M-Pesa payment was not completed.",
    });
  }

  const checkoutReqId = ord.mpesaCheckoutId;
  if (!checkoutReqId) {
    return res.json({ status: "pending", orderNumber: ord.orderNumber, detail: "no_checkout_request" });
  }

  try {
    const q = await queryStkCheckout(checkoutReqId);
    const paid =
      mapStkQueryToPaid(q) || String(q?.ResultDesc || "").toLowerCase().includes("success");

    if (paid) {
      await markOrderPaid(ord.id, {
        mpesaReceipt: checkoutReqId,
      });
      return res.json({
        status: "paid",
        orderNumber: ord.orderNumber,
        orderId: ord.id,
      });
    }

    const desc = q?.ResultDesc || q?.ResultDescription || "";
    const resultCode = q?.ResultCode ?? q?.resultCode;
    if (resultCode !== undefined && String(resultCode) !== "0") {
      const failedOrder = await markOrderFailed(ord.id, {
        checkoutId: checkoutReqId,
        detail: desc || "M-Pesa payment was not completed.",
      });
      const cancelled = failedOrder?.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED;
      return res.json({
        status: cancelled ? "cancelled" : "failed",
        daraja: cancelled
          ? "Order cancelled after failed M-Pesa attempts. Please create a new order."
          : desc || "M-Pesa payment was not completed.",
        orderNumber: ord.orderNumber,
      });
    }

    return res.json({ status: "pending", daraja: desc, orderNumber: ord.orderNumber });
  } catch (e) {
    console.error(e.response?.data || e.message);
    return res.json({
      status: "pending",
      detail: e.message,
      orderNumber: ord.orderNumber,
    });
  }
});

router.post("/mpesa/callback", async (req, res) => {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  try {
    const stk = req.body?.Body?.stkCallback;
    const checkoutReq = stk?.CheckoutRequestID;
    const resultCode = stk?.ResultCode;
    const meta = stk?.CallbackMetadata?.Item;
    let receipt = null;
    if (Array.isArray(meta)) {
      const rec = meta.find((i) => i.Name === "MpesaReceiptNumber");
      receipt = rec?.Value;
    }
    if (!checkoutReq || resultCode === undefined) return;

    const order = await prisma.order.findFirst({
      where: { mpesaCheckoutId: checkoutReq },
    });
    if (!order) return;

    if (Number(resultCode) !== 0) {
      await markOrderFailed(order.id, {
        checkoutId: checkoutReq,
        detail: stk?.ResultDesc || "M-Pesa payment was not completed.",
      });
      return;
    }

    if (order) {
      await markOrderPaid(order.id, { mpesaReceipt: receipt || checkoutReq });
    }
  } catch (e) {
    console.error("mpesa callback", e.message);
  }
});

router.post("/paystack/create", async (req, res) => {
  const { orderId } = req.body || {};

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order || order.paymentMethod !== PaymentMethod.CARD) {
    return res.status(400).json({ error: "Invalid order for Paystack" });
  }
  if (order.paymentStatus === PaymentStatus.PAID) {
    return res.status(400).json({ error: "Order is already paid" });
  }

  try {
    const customerEmail = order.guestEmail || order.user?.email || "guest@example.com";
    const reference = paystackReference(order.orderNumber);
    const clientUrl = String(process.env.CLIENT_URL || "").split(",")[0] || "http://localhost:5173";
    const callbackUrl = `${clientUrl.replace(/\/$/, "")}/checkout?order=${encodeURIComponent(
      order.orderNumber,
    )}&provider=paystack`;

    const { data } = await axios.post(
      `${paystackBaseUrl}/transaction/initialize`,
      {
        email: customerEmail,
        amount: Math.round(Number(order.totalAmount) * 100),
        currency: process.env.PAYSTACK_CURRENCY || "KES",
        reference,
        callback_url: callbackUrl,
        channels: ["card"],
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.guestName || order.user?.fullName || "",
          phone: order.guestPhone || "",
        },
      },
      { headers: paystackHeaders() },
    );

    await prisma.order.update({
      where: { id: order.id },
      data: {
        pesapalOrderId: reference,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    res.json({
      authorizationUrl: data?.data?.authorization_url,
      accessCode: data?.data?.access_code,
      reference: data?.data?.reference || reference,
    });
  } catch (e) {
    console.error("paystack:", e.response?.data || e.message);
    res.status(500).json({
      error: e.response?.data?.message || e.message || "Paystack order failed",
    });
  }
});

router.get("/paystack/status/:orderNumber", async (req, res) => {
  const ord = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
  if (!ord) return res.status(404).json({ status: "not_found" });

  if (ord.paymentStatus === PaymentStatus.PAID) {
    return res.json({ status: "paid", orderNumber: ord.orderNumber, orderId: ord.id });
  }
  if (ord.paymentStatus === PaymentStatus.FAILED) {
    return res.json({
      status: "failed",
      orderNumber: ord.orderNumber,
      detail: "Card payment was not completed.",
    });
  }
  if (!ord.pesapalOrderId) {
    return res.json({ status: "pending", orderNumber: ord.orderNumber, detail: "no_reference" });
  }

  try {
    const synced = await syncPaystackOrder(ord, req.query.reference || ord.pesapalOrderId);
    return res.json({
      status: synced.kind,
      orderNumber: ord.orderNumber,
      detail: synced.tx?.gateway_response || synced.tx?.message || "",
    });
  } catch (e) {
    console.error("paystack status:", e.response?.data || e.message);
    return res.json({
      status: "pending",
      detail: e.message,
      orderNumber: ord.orderNumber,
    });
  }
});

router.post("/paystack/webhook", async (req, res) => {
  const event = req.body || {};
  const reference = event?.data?.reference;
  res.sendStatus(200);
  if (event.event !== "charge.success" || !reference) return;

  try {
    const ord = await prisma.order.findFirst({ where: { pesapalOrderId: String(reference) } });
    if (ord) await syncPaystackOrder(ord, String(reference));
  } catch (e) {
    console.error("paystack webhook:", e.response?.data || e.message);
  }
});

export default router;
