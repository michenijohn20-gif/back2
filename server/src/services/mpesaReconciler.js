import { OrderFulfillmentStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { markOrderFailed, markOrderPaid } from "../routes/orders.js";
import { mapStkQueryToPaid, queryStkCheckout } from "./mpesa.js";

const intervalMs = Number(process.env.MPESA_RECONCILE_INTERVAL_MS || 60_000);
const pendingAgeMs = Number(process.env.MPESA_RECONCILE_PENDING_AGE_MS || 90_000);
const timeoutMs = Number(process.env.MPESA_STATUS_TIMEOUT_MS || 150_000);
const limit = Number(process.env.MPESA_RECONCILE_LIMIT || 10);

function getDarajaResultCode(resp) {
  return resp?.ResultCode ?? resp?.resultCode ?? resp?.errorCode ?? resp?.error_code;
}

function getDarajaResultDesc(resp) {
  return (
    resp?.ResultDesc ||
    resp?.resultDesc ||
    resp?.ResultDescription ||
    resp?.errorMessage ||
    resp?.error_message ||
    resp?.CustomerMessage ||
    ""
  );
}

function timedOut(order) {
  return Date.now() - new Date(order.updatedAt || order.createdAt).getTime() > timeoutMs;
}

export async function reconcilePendingMpesaOrders() {
  const cutoff = new Date(Date.now() - pendingAgeMs);
  const orders = await prisma.order.findMany({
    where: {
      paymentMethod: PaymentMethod.MPESA,
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: { not: OrderFulfillmentStatus.CANCELLED },
      mpesaCheckoutId: { not: null },
      updatedAt: { lte: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  for (const order of orders) {
    try {
      const resp = await queryStkCheckout(order.mpesaCheckoutId);
      const paid =
        mapStkQueryToPaid(resp) || String(resp?.ResultDesc || "").toLowerCase().includes("success");
      if (paid) {
        await markOrderPaid(order.id, { mpesaReceipt: order.mpesaCheckoutId });
        continue;
      }

      const resultCode = getDarajaResultCode(resp);
      if (resultCode !== undefined && String(resultCode) !== "0") {
        await markOrderFailed(order.id, {
          checkoutId: order.mpesaCheckoutId,
          detail: getDarajaResultDesc(resp) || "M-Pesa payment was not completed.",
        });
      }
    } catch (e) {
      const daraja = e.response?.data;
      const resultCode = getDarajaResultCode(daraja);
      const desc = getDarajaResultDesc(daraja) || e.message;
      if (resultCode !== undefined && String(resultCode) !== "0") {
        await markOrderFailed(order.id, {
          checkoutId: order.mpesaCheckoutId,
          detail: desc || "M-Pesa payment was not completed.",
        });
        continue;
      }
      if (timedOut(order)) {
        await markOrderFailed(order.id, {
          checkoutId: order.mpesaCheckoutId,
          detail: "M-Pesa prompt timed out before payment was confirmed.",
        });
        continue;
      }
      console.warn("[mpesa-reconcile]", order.orderNumber, daraja || e.message);
    }
  }
}

export function startMpesaReconciler() {
  if (process.env.MPESA_RECONCILER_ENABLED === "false") return;

  const timer = setInterval(() => {
    reconcilePendingMpesaOrders().catch((e) => {
      console.warn("[mpesa-reconcile]", e.message);
    });
  }, intervalMs);

  timer.unref?.();
}
