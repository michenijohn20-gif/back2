import nodemailer from "nodemailer";
import "dotenv/config";
import { prisma } from "../prisma.js";

async function getTransporter() {
  if (!process.env.SMTP_HOST) {
    console.warn("[email] SMTP not configured — emails logged only");
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendMailSafe({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || "RefurbKE <noreply@refurbke.local>";
  const t = await getTransporter();
  if (!t) {
    console.log("[email] (noop) →", to, subject);
    return { ok: true, noop: true };
  }
  try {
    await t.sendMail({ from, to, subject, html, text });
    return { ok: true };
  } catch (e) {
    console.error("[email] send failed:", e.message);
    return { ok: false, error: e.message };
  }
}

async function getOrderEmailFlags(order) {
  try {
    const fresh = await prisma.order.findUnique({
      where: { id: order.id },
      select: { confirmationEmailSent: true, adminEmailSent: true },
    });
    return {
      confirmationEmailSent: Boolean(fresh?.confirmationEmailSent ?? order.confirmationEmailSent),
      adminEmailSent: Boolean(fresh?.adminEmailSent ?? order.adminEmailSent),
    };
  } catch (e) {
    console.error("[email] could not read email flags:", e.message);
    return {
      confirmationEmailSent: Boolean(order.confirmationEmailSent),
      adminEmailSent: Boolean(order.adminEmailSent),
    };
  }
}

async function markOrderEmailSent(orderId, field) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { [field]: true },
    });
  } catch (e) {
    console.error(`[email] could not update ${field}:`, e.message);
  }
}

export async function sendOrderEmails({ order, items }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const customerEmail = order.guestEmail || order.user?.email;
  const { confirmationEmailSent, adminEmailSent } = await getOrderEmailFlags(order);
  const linesHtml = items
    .map(
      (l) =>
        `<tr><td>${l.quantity}× ${l.brandName} ${l.productName}</td><td align="right">KES ${Number(l.unitPrice * l.quantity).toLocaleString("en-KE")}</td></tr>`
    )
    .join("");

  const summary = `
    <p>Hello ${order.guestName || order.user?.fullName || ""},</p>
    <p><strong>Order ${order.orderNumber}</strong> is confirmed. You'll receive shipping updates via email.</p>
    <p>Estimated delivery: ${order.estimatedDeliveryDays || "5–9 business days within Kenya"}</p>
    <table cellpadding="8" cellspacing="0" border="1" width="100%" style="border-collapse:collapse;border-color:#E5E7EB;">
      ${linesHtml}
      <tr><td>Shipping</td><td align="right">KES ${Number(order.shippingAmount).toLocaleString("en-KE")}</td></tr>
      <tr><td><strong>Total</strong></td><td align="right"><strong>KES ${Number(order.totalAmount).toLocaleString("en-KE")}</strong></td></tr>
    </table>
    <p style="color:#6B7280;font-size:14px;">Delivery to ${order.deliveryTown}, ${order.deliveryCounty}.</p>
    <p>— RefurbKE</p>`;

  if (customerEmail && !confirmationEmailSent) {
    const result = await sendMailSafe({
      to: customerEmail,
      subject: `Your RefurbKE order ${order.orderNumber} is confirmed`,
      html: summary,
    });
    if (result.ok && !result.noop) {
      await markOrderEmailSent(order.id, "confirmationEmailSent");
    }
  }
  if (adminEmail && !adminEmailSent) {
    const result = await sendMailSafe({
      to: adminEmail,
      subject: `New paid order ${order.orderNumber}`,
      html: `<p>New paid order.</p>${summary}`,
    });
    if (result.ok && !result.noop) {
      await markOrderEmailSent(order.id, "adminEmailSent");
    }
  }
}
