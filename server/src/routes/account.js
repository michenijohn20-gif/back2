import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { requireUser } from "../middleware/authUser.js";
import { isValidKenyaPhone } from "../utils/phone.js";

const router = Router();
router.use(requireUser);

router.patch("/profile", async (req, res) => {
  const { fullName, phone } = req.body || {};
  if (phone !== undefined && phone !== null && phone !== "" && !isValidKenyaPhone(phone)) {
    return res.status(400).json({ error: "Invalid Kenyan phone number" });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(fullName !== undefined ? { fullName: String(fullName) } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
    select: { id: true, email: true, fullName: true, phone: true },
  });
  res.json(user);
});

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: "Provide current password and a new password (6+ chars)" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.passwordHash) return res.status(400).json({ error: "Password login not linked" });
  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Current password incorrect" });
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

router.get("/orders", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      createdAt: true,
    },
  });
  res.json(orders);
});

router.get("/orders/:orderNumber", async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { orderNumber: req.params.orderNumber, userId: req.user.id },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

export default router;
