import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import axios from "axios";
import { prisma } from "../prisma.js";
import { adminAuth, signAdminToken } from "../middleware/adminAuth.js";
import {
  slugify,
  uniqueProductSlug,
  uniqueCategorySlug,
  uniqueBrandSlug,
} from "../utils/slug.js";
import { uploadBuffer } from "../services/cloudinarySvc.js";
import { SETTING_KEYS, setSetting, getSetting } from "../services/settings.js";
import { PaymentStatus, OrderFulfillmentStatus } from "@prisma/client";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
const mobileApiBase = "https://api.mobileapi.dev";

function mobileApiHeaders() {
  const key = process.env.MOBILEAPI_KEY;
  if (!key) throw new Error("MobileAPI key missing. Add MOBILEAPI_KEY to enable spec autofill.");
  return { Authorization: `Token ${key}`, Accept: "application/json" };
}

function compactSpecs(device = {}) {
  const specs = {
    Brand: device.brand?.name || device.brand_name || device.manufacturer_name || "",
    Model: device.name || "",
    Display: device.screen_resolution || device.display || "",
    Camera: device.camera || "",
    Battery: device.battery_capacity || "",
    Hardware: device.hardware || "",
    Storage: device.storage || "",
    Colours: device.colors || "",
    Weight: device.weight || "",
    Thickness: device.thickness || "",
    Released: device.release_date || "",
  };
  return Object.fromEntries(Object.entries(specs).filter(([, value]) => value));
}

function imageUrlsFromDevice(device = {}) {
  const raw = [
    device.image_url,
    device.image,
    device.thumbnail,
    device.main_image,
    ...(Array.isArray(device.images) ? device.images : []),
  ];
  return raw
    .map((item) => (typeof item === "string" ? item : item?.image_url || item?.url))
    .filter(Boolean)
    .slice(0, 6);
}

function variantsFromDevice(device = {}) {
  const storages = String(device.storage || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  const colors = String(device.colors || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  const baseStorages = storages.length ? storages : [""];
  const baseColors = colors.length ? colors : [""];
  return baseStorages.slice(0, 3).flatMap((storage) =>
    baseColors.slice(0, 2).map((color) => ({
      storage,
      color,
      priceExcellent: 0,
      priceGood: 0,
      priceFair: 0,
      stockExcellent: 0,
      stockGood: 0,
      stockFair: 0,
    })),
  );
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const admin = await prisma.adminUser.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password), admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signAdminToken(admin.id, admin.email);
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.use(adminAuth);

router.get("/dashboard", async (_req, res) => {
  const [totalOrders, paidOrders, customers, revenueAgg, last30] = await prisma.$transaction([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.PAID } }),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        paymentStatus: PaymentStatus.PAID,
      },
      select: { createdAt: true },
    }),
  ]);

  const byDay = {};
  for (const o of last30) {
    const d = o.createdAt.toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  }
  const series = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  res.json({
    totalOrders,
    paidOrders,
    pendingOrders: await prisma.order.count({
      where: {
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: { in: [OrderFulfillmentStatus.PROCESSING, OrderFulfillmentStatus.CONFIRMED] },
      },
    }),
    totalCustomers: customers,
    revenueKes: revenueAgg._sum.totalAmount || 0,
    ordersPerDay: series,
  });
});

router.get("/orders", async (req, res) => {
  const { status, q, from, to, page = "1", pageSize = "20" } = req.query;
  const take = Math.min(100, Number(pageSize) || 20);
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const where = {
    AND: [
      status ? { fulfillmentStatus: String(status) } : {},
      from ? { createdAt: { gte: new Date(String(from)) } } : {},
      to ? { createdAt: { lte: new Date(String(to)) } } : {},
      q
        ? {
            OR: [
              { orderNumber: { contains: String(q), mode: "insensitive" } },
              { guestName: { contains: String(q), mode: "insensitive" } },
              { guestEmail: { contains: String(q), mode: "insensitive" } },
              { guestPhone: { contains: String(q), mode: "insensitive" } },
            ],
          }
        : {},
    ].filter((x) => Object.keys(x).length > 0),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        deliveryCounty: true,
        deliveryTown: true,
        totalAmount: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
        items: { select: { quantity: true } },
        user: { select: { fullName: true, email: true, phone: true } },
      },
    }),
  ]);
  res.json({ total, orders: rows, page: Number(page), pageSize: take });
});

router.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      user: { select: { id: true, email: true, fullName: true, phone: true } },
    },
  });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

router.patch("/orders/:id", async (req, res) => {
  const { fulfillmentStatus, trackingNumber, adminNotes } = req.body || {};
  const data = {};
  if (fulfillmentStatus) data.fulfillmentStatus = fulfillmentStatus;
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
  if (adminNotes !== undefined) data.adminNotes = adminNotes;
  const order = await prisma.order.update({ where: { id: req.params.id }, data });
  res.json(order);
});

router.get("/products", async (req, res) => {
  const { page = "1", pageSize = "50" } = req.query;
  const take = Math.min(100, Math.max(1, Number(pageSize) || 50));
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const [total, products] = await prisma.$transaction([
    prisma.product.count(),
    prisma.product.findMany({
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true, url: true } },
        variants: {
          select: {
            id: true,
            priceExcellent: true,
            stockExcellent: true,
            stockGood: true,
            stockFair: true,
          },
        },
      },
    }),
  ]);
  res.json({ total, products, page: Number(page), pageSize: take });
});

router.get("/products/autofill", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Search query required" });

  try {
    const { data } = await axios.get(`${mobileApiBase}/devices/search/`, {
      params: { name: q },
      headers: mobileApiHeaders(),
    });
    const devices = data.devices || data.results || (Array.isArray(data) ? data : []);
    const device = devices[0] || data.device || data;
    if (!device?.name) return res.status(404).json({ error: "No matching device found" });

    res.json({
      source: "MobileAPI.dev",
      name: device.name,
      description:
        device.description ||
        `${device.brand?.name || device.brand_name || ""} ${device.name} refurbished device, tested and ready for daily use.`,
      whatsInBox: "Device, charging cable, SIM ejector tool, RefurbKE warranty card",
      specs: compactSpecs(device),
      imageUrls: imageUrlsFromDevice(device),
      variants: variantsFromDevice(device),
    });
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status === 401 ? 503 : status).json({
      error: e.message || "Could not fetch device specs",
      detail: e.response?.data?.detail || e.response?.data?.message,
    });
  }
});

router.get("/products/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { id: "asc" } },
    },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

router.post("/products", async (req, res) => {
  const {
    name,
    slug: slugIn,
    description,
    whatsInBox,
    specs,
    categoryId,
    brandId,
    featured,
    variants,
    imageUrls,
    metaTitle,
    metaDescription,
  } = req.body || {};
  if (!name || !description || !categoryId || !brandId) {
    return res.status(400).json({ error: "name, description, categoryId, brandId required" });
  }
  const base = slugIn ? slugify(slugIn) : slugify(name);
  const slug = await uniqueProductSlug(prisma, base);
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      whatsInBox: whatsInBox || "",
      specs: specs || {},
      categoryId,
      brandId,
      featured: Boolean(featured),
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      variants: {
        create: (variants || []).map((v) => ({
          storage: v.storage || null,
          color: v.color || null,
          priceExcellent: Number(v.priceExcellent),
          priceGood: Number(v.priceGood),
          priceFair: Number(v.priceFair),
          stockExcellent: Number(v.stockExcellent ?? 0),
          stockGood: Number(v.stockGood ?? 0),
          stockFair: Number(v.stockFair ?? 0),
        })),
      },
      images: {
        create: (imageUrls || []).map((url, i) => ({ url, sortOrder: i })),
      },
    },
    include: { variants: true, images: true },
  });
  res.status(201).json(product);
});

router.patch("/products/:id", async (req, res) => {
  const id = req.params.id;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const {
    name,
    slug: slugIn,
    description,
    whatsInBox,
    specs,
    categoryId,
    brandId,
    featured,
    metaTitle,
    metaDescription,
    variants,
    deletedVariantIds,
    imageUrls,
  } = req.body || {};

  let slug = existing.slug;
  if (name && name !== existing.name) {
    const base = slugIn ? slugify(slugIn) : slugify(name);
    slug = await uniqueProductSlug(prisma, base, id);
  }

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(whatsInBox !== undefined ? { whatsInBox } : {}),
        ...(specs !== undefined ? { specs } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(brandId !== undefined ? { brandId } : {}),
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        ...(metaTitle !== undefined ? { metaTitle } : {}),
        ...(metaDescription !== undefined ? { metaDescription } : {}),
      },
    });

    if (Array.isArray(imageUrls)) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      const images = imageUrls
        .map((url, i) => ({ url: String(url).trim(), sortOrder: i, productId: id }))
        .filter((img) => img.url);
      if (images.length) await tx.productImage.createMany({ data: images });
    }

    if (Array.isArray(deletedVariantIds) && deletedVariantIds.length) {
      await tx.productVariant.deleteMany({
        where: {
          productId: id,
          id: { in: deletedVariantIds.map(String) },
          orderItems: { none: {} },
        },
      });
    }

    if (Array.isArray(variants)) {
      for (const v of variants) {
        const data = {
          storage: v.storage || null,
          color: v.color || null,
          priceExcellent: Number(v.priceExcellent || 0),
          priceGood: Number(v.priceGood || 0),
          priceFair: Number(v.priceFair || 0),
          stockExcellent: Number(v.stockExcellent || 0),
          stockGood: Number(v.stockGood || 0),
          stockFair: Number(v.stockFair || 0),
        };
        if (v.id) {
          await tx.productVariant.updateMany({ where: { id: String(v.id), productId: id }, data });
        } else {
          await tx.productVariant.create({ data: { productId: id, ...data } });
        }
      }
    }

    return tx.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  });
  res.json(product);
});

router.delete("/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post("/products/:id/variants", async (req, res) => {
  const v = req.body || {};
  const created = await prisma.productVariant.create({
    data: {
      productId: req.params.id,
      storage: v.storage || null,
      color: v.color || null,
      priceExcellent: Number(v.priceExcellent),
      priceGood: Number(v.priceGood),
      priceFair: Number(v.priceFair),
      stockExcellent: Number(v.stockExcellent ?? 0),
      stockGood: Number(v.stockGood ?? 0),
      stockFair: Number(v.stockFair ?? 0),
    },
  });
  res.status(201).json(created);
});

router.patch("/variants/:id", async (req, res) => {
  const v = req.body || {};
  const updated = await prisma.productVariant.update({
    where: { id: req.params.id },
    data: {
      ...(v.storage !== undefined ? { storage: v.storage } : {}),
      ...(v.color !== undefined ? { color: v.color } : {}),
      ...(v.priceExcellent !== undefined ? { priceExcellent: Number(v.priceExcellent) } : {}),
      ...(v.priceGood !== undefined ? { priceGood: Number(v.priceGood) } : {}),
      ...(v.priceFair !== undefined ? { priceFair: Number(v.priceFair) } : {}),
      ...(v.stockExcellent !== undefined ? { stockExcellent: Number(v.stockExcellent) } : {}),
      ...(v.stockGood !== undefined ? { stockGood: Number(v.stockGood) } : {}),
      ...(v.stockFair !== undefined ? { stockFair: Number(v.stockFair) } : {}),
    },
  });
  res.json(updated);
});

router.delete("/variants/:id", async (req, res) => {
  await prisma.productVariant.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post("/products/:id/images", async (req, res) => {
  const { urls } = req.body || {};
  if (!Array.isArray(urls)) return res.status(400).json({ error: "urls array required" });
  const productId = req.params.id;
  const max = await prisma.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
  let start = (max._max.sortOrder ?? -1) + 1;
  const created = [];
  for (const url of urls) {
    const img = await prisma.productImage.create({
      data: { productId, url, sortOrder: start++ },
    });
    created.push(img);
  }
  res.json(created);
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file?.buffer) return res.status(400).json({ error: "file required" });
  try {
    const r = await uploadBuffer(req.file.buffer, "refurbke/admin");
    res.json({ url: r.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/categories", async (_req, res) => {
  res.json(await prisma.category.findMany({ orderBy: { sortOrder: "asc" } }));
});

router.post("/categories", async (req, res) => {
  const { name, iconUrl, sortOrder } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const slug = await uniqueCategorySlug(prisma, slugify(name));
  const cat = await prisma.category.create({
    data: { name, slug, iconUrl: iconUrl || null, sortOrder: Number(sortOrder || 0) },
  });
  res.status(201).json(cat);
});

router.patch("/categories/:id", async (req, res) => {
  const { name, iconUrl, sortOrder } = req.body || {};
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  let slug = existing.slug;
  if (name && name !== existing.name) {
    slug = await uniqueCategorySlug(prisma, slugify(name), existing.id);
  }
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name, slug } : {}),
      ...(iconUrl !== undefined ? { iconUrl } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
    },
  });
  res.json(cat);
});

router.delete("/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/brands", async (_req, res) => {
  res.json(await prisma.brand.findMany({ orderBy: { name: "asc" } }));
});

router.post("/brands", async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const slug = await uniqueBrandSlug(prisma, slugify(name));
  const b = await prisma.brand.create({ data: { name, slug } });
  res.status(201).json(b);
});

router.get("/customers", async (req, res) => {
  const { page = "1", pageSize = "20" } = req.query;
  const take = Math.min(100, Number(pageSize) || 20);
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const [total, users] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { paymentStatus: PaymentStatus.PAID },
          select: { totalAmount: true },
        },
      },
    }),
  ]);
  const rows = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    createdAt: u.createdAt,
    orderCount: u._count.orders,
    totalSpent: u.orders.reduce((s, o) => s + o.totalAmount, 0),
  }));
  res.json({ total, customers: rows, page: Number(page), pageSize: take });
});

router.get("/customers/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { items: true } } },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.get("/settings", async (_req, res) => {
  const keys = [
    SETTING_KEYS.STORE_NAME,
    SETTING_KEYS.CONTACT_EMAIL,
    SETTING_KEYS.SHIPPING_NAIROBI,
    SETTING_KEYS.SHIPPING_UPCOUNTRY,
    "mpesa_shortcode",
    "mpesa_passkey",
    "mpesa_consumer_key",
    "mpesa_consumer_secret",
    "paystack_public_key",
    "paystack_secret_key",
  ];
  const out = {};
  for (const k of keys) {
    out[k] = await getSetting(k, "");
  }
  res.json(out);
});

router.post("/settings", async (req, res) => {
  const body = req.body || {};
  for (const [k, v] of Object.entries(body)) {
    await setSetting(k, v);
  }
  res.json({ ok: true });
});

export default router;
