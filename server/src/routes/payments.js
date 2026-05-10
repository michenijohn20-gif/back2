import { Router } from "express";
import { prisma } from "../prisma.js";
import {
  stkPush,
  queryStkCheckout,
  mapStkQueryToPaid,
} from "../services/mpesa.js";
import { formattedForMpesa, isValidKenyaPhone } from "../utils/phone.js";
import { markOrderFailed, markOrderPaid } from "./orders.js";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import axios from "axios";

const router = Router();

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
    return res.json({
      status: "failed",
      orderNumber: ord.orderNumber,
      detail: "M-Pesa payment was not completed.",
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
      await markOrderFailed(ord.id);
      return res.json({
        status: "failed",
        daraja: desc || "M-Pesa payment was not completed.",
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
      await markOrderFailed(order.id);
      return;
    }

    if (order) {
      await markOrderPaid(order.id, { mpesaReceipt: receipt || checkoutReq });
    }
  } catch (e) {
    console.error("mpesa callback", e.message);
  }
});

router.post("/pesapal/create", async (req, res) => {
  const { orderId, callbackUrl, cancelUrl } = req.body || {};
  const baseUrl =
    process.env.PESAPAL_BASE_URL ||
    (process.env.PESAPAL_ENV === "live"
      ? "https://pay.pesapal.com/v3/api"
      : "https://cybqa.pesapal.com/pesapalv3/api");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order || order.paymentMethod !== PaymentMethod.CARD) {
    return res.status(400).json({ error: "Invalid order for Pesapal" });
  }
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) {
    return res.status(503).json({
      error:
        "Pesapal credentials not configured. Add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET.",
    });
  }

  try {
    const tokenResp = await axios.post(
      `${baseUrl}/Auth/RequestToken`,
      { consumer_key: key, consumer_secret: secret },
      { headers: { "Content-Type": "application/json", Accept: "application/json" } },
    );

    const bearer = tokenResp.data?.token;
    if (!bearer) throw new Error("No Pesapal bearer token returned");

    const customerEmail = order.guestEmail || order.user?.email || "guest@example.com";
    const orderReq = {
      id: order.orderNumber,
      currency: "KES",
      amount: order.totalAmount,
      description: `RefurbKE order ${order.orderNumber}`,
      callback_url:
        callbackUrl || `${process.env.CLIENT_URL}/checkout/pesapal-complete?order=${order.orderNumber}`,
      notification_id: process.env.PESAPAL_IPN || "https://localhost/ipn-placeholder",
      billing_address: {
        email_address: customerEmail,
        phone_number: order.guestPhone || "",
      },
      cancel_url: cancelUrl || `${process.env.CLIENT_URL}/checkout?cancel=1`,
    };

    const create = await axios.post(`${baseUrl}/Transactions/SubmitOrderRequest`, orderReq, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const iframe = create.data?.redirect_url || create.data?.redirectUrl || create.data?.orderRedirectUrl;

    await prisma.order.update({
      where: { id: order.id },
      data: { pesapalOrderId: create.data?.order_tracking_id || create.data?.orderTrackingId },
    });

    res.json({
      iframeUrl: iframe || create.data,
      pesapalTrackingId: create.data?.order_tracking_id,
    });
  } catch (e) {
    console.error("pesapal:", e.response?.data || e.message);
    res.status(500).json({
      error: e.response?.data?.message || e.message || "Pesapal order failed",
    });
  }
});

router.post("/pesapal/ipn-complete", async (req, res) => {
  const { orderTrackingId } = req.body || {};
  if (!orderTrackingId) return res.status(400).json({ error: "missing" });
  const ord = await prisma.order.findFirst({ where: { pesapalOrderId: String(orderTrackingId) } });
  if (ord) await markOrderPaid(ord.id, {});
  res.json({ ok: true });
});

export default router;
