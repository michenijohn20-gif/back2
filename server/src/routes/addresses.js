import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireUser } from "../middleware/authUser.js";
import { isValidKenyaPhone } from "../utils/phone.js";
import { KENYAN_COUNTIES } from "../data/kenyanCounties.js";

const router = Router();
router.use(requireUser);

router.get("/", async (req, res) => {
  const list = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  res.json(list);
});

router.post("/", async (req, res) => {
  const { label, fullName, phone, county, townArea, building, street, isDefault } = req.body || {};
  if (!fullName || !phone || !county || !townArea)
    return res.status(400).json({ error: "Name, phone, county, and area are required" });
  if (!KENYAN_COUNTIES.includes(county))
    return res.status(400).json({ error: "Invalid county selected" });
  if (!isValidKenyaPhone(phone)) return res.status(400).json({ error: "Invalid Kenyan phone number" });

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const created = await prisma.address.create({
    data: {
      userId: req.user.id,
      label: label || null,
      fullName,
      phone,
      county,
      townArea,
      building: building || null,
      street: street || null,
      isDefault: Boolean(isDefault),
    },
  });
  res.status(201).json(created);
});

router.patch("/:id", async (req, res) => {
  const { label, fullName, phone, county, townArea, building, street, isDefault } = req.body || {};
  const addr = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!addr) return res.status(404).json({ error: "Not found" });
  if (phone && !isValidKenyaPhone(phone))
    return res.status(400).json({ error: "Invalid Kenyan phone number" });
  if (county && !KENYAN_COUNTIES.includes(county))
    return res.status(400).json({ error: "Invalid county selected" });

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const updated = await prisma.address.update({
    where: { id: addr.id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(fullName !== undefined ? { fullName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(county !== undefined ? { county } : {}),
      ...(townArea !== undefined ? { townArea } : {}),
      ...(building !== undefined ? { building } : {}),
      ...(street !== undefined ? { street } : {}),
      ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
