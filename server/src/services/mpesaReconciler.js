import { OrderFulfillmentStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { markOrderFailed, markOrderPaid } from "../routes/orders.js";
import { mapStkQueryToPaid, queryStkCheckout } from "./mpesa.js";

const intervalMs = Number(process.env.MPESA_RECONCILE_INTERVAL_MS || 60_000);
const pendingAgeMs = Number(process.env.MPESA_RECONCILE_PENDING_AGE_MS || 90_000);
const limit = Number(process.env.MPESA_RECONCILE_LIMIT || 10);

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

      const resultCode = resp?.ResultCode ?? resp?.resultCode;
      if (resultCode !== undefined && String(resultCode) !== "0") {
        await markOrderFailed(order.id, {
          checkoutId: order.mpesaCheckoutId,
          detail: resp?.ResultDesc || resp?.ResultDescription || "M-Pesa payment was not completed.",
        });
      }
    } catch (e) {
      console.warn("[mpesa-reconcile]", order.orderNumber, e.response?.data || e.message);
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
