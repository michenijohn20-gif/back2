/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const cats = [
  { name: "Smartphones", slug: "smartphones", sortOrder: 1 },
  { name: "Laptops", slug: "laptops", sortOrder: 2 },
  { name: "Tablets", slug: "tablets", sortOrder: 3 },
  { name: "Audio", slug: "audio", sortOrder: 4 },
  { name: "Gaming", slug: "gaming", sortOrder: 5 },
  { name: "Cameras", slug: "cameras", sortOrder: 6 },
  { name: "Accessories", slug: "accessories", sortOrder: 7 },
];

const brandsList = [
  "Apple",
  "Samsung",
  "Google",
  "Sony",
  "HP",
  "Dell",
  "Lenovo",
  "Microsoft",
  "Nikon",
  "Canon",
  "JBL",
  "Anker",
  "Tecno",
  "Xiaomi",
  "Nintendo",
  "Spigen",
  "Keychron",
];

function img(seed) {
  return `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=960&q=80`;
}

const productsData = [
  {
    name: "Apple iPhone 14 — 128GB",
    slug: "apple-iphone-14-128gb",
    category: "smartphones",
    brand: "Apple",
    description:
      "Refurbished iPhone 14 with Super Retina XDR display and all-day battery. Battery health tested above 82%, fully reset for Kenyan networks with valid IMEI paperwork.",
    whatsInBox: "iPhone 14 handset, braided USB‑C cable, SIM tool, RefurbKE warranty leaflet.",
    featured: true,
    images: [img("photo-1695048133142-a84490416e92"), img("photo-1678685888221-cda773a03fdb")],
    variants: [{ storage: "128GB", color: "Midnight Blue", priceE: 78900, priceG: 72900, priceF: 66400 }],
  },
  {
    name: "Samsung Galaxy A54 — 256GB",
    category: "smartphones",
    brand: "Samsung",
    description:
      "Bright AMOLED 120Hz display, resilient IP rating, dependable Exynos chipset for Kenyan daily use.",
    whatsInBox: "Galaxy A54, USB‑C cable, wall adapter (UK‑style), quick start booklet.",
    featured: true,
    images: [img("photo-1610945415295-d9bbf067e59c")],
    variants: [{ storage: "256GB", color: "Awesome Graphite", priceE: 42900, priceG: 39900, priceF: 36400 }],
  },
  {
    name: "Google Pixel 8 — 128GB",
    category: "smartphones",
    brand: "Google",
    description:
      "Clean Android photography with HDR on every shot. Bands tested for Faiba, Safaricom, and Airtel Kenya.",
    whatsInBox: "Pixel 8, USB‑C cable, USB‑A adapter dongle.",
    featured: false,
    images: [img("photo-1678911820864-e2c567c655d7")],
    variants: [{ storage: "128GB", color: "Obsidian Black", priceE: 84900, priceG: 78900, priceF: 71900 }],
  },
  {
    name: "Tecno Phantom X2 — 256GB",
    category: "smartphones",
    brand: "Tecno",
    description:
      "Curved flagship feel with dependable battery for commuters between Westlands and Thika Road.",
    whatsInBox: "Phantom X2, 45W charger, tempered glass protector pre‑applied.",
    featured: false,
    images: [img("photo-1510557880182-cd971f7c5f73")],
    variants: [{ storage: "256GB", color: "Stargaze Blue", priceE: 49900, priceG: 46500, priceF: 42900 }],
  },
  {
    name: "Xiaomi Redmi Note 13 Pro — 256GB",
    category: "smartphones",
    brand: "Xiaomi",
    description:
      "200MP primary camera sampling and a fast 120W-class charging profile (Regional adapter included).",
    whatsInBox: "Redmi Note 13 Pro, USB‑A to USB‑C cable, clear case.",
    featured: false,
    images: [img("photo-1616348436168-de43ad0db179")],
    variants: [{ storage: "256GB", color: "Aurora Purple", priceE: 36900, priceG: 33900, priceF: 31200 }],
  },
  {
    name: 'MacBook Air 13" M2 — 8GB unified',
    category: "laptops",
    brand: "Apple",
    description:
      "Silent aluminium ultrabook for remote work across Nairobi hubs. Charger tested under KE 240V mains.",
    whatsInBox: "MacBook Air, 35W dual USB‑C charger, braided MagSafe/USB‑C lead.",
    featured: true,
    images: [img("photo-1517336714731-489689fd1ca8")],
    variants: [{ storage: "512GB SSD", color: "Space Grey", priceE: 119900, priceG: 112400, priceF: 106000 }],
  },
  {
    name: "HP EliteBook 840 G9 — Intel i7",
    category: "laptops",
    brand: "HP",
    description:
      "Thin premium business chassis with TPM and fingerprint reader suited to banking & audit teams.",
    whatsInBox: "EliteBook, 65W barrel adapter + USB‑C PD tip, docks optional via RefurbKE support.",
    featured: false,
    images: [img("photo-1588872657592-8497029bac27")],
    variants: [{ storage: "512GB SSD", color: "Silver", priceE: 94900, priceG: 89900, priceF: 84500 }],
  },
  {
    name: 'Dell XPS 13 Plus — OLED 13.4"',
    category: "laptops",
    brand: "Dell",
    description:
      "Ultra compact travel laptop with tactile low‑travel keyboard and Evo certified internals.",
    whatsInBox: "XPS notebook, compact 60W GaN USB‑C PSU.",
    featured: false,
    images: [img("photo-1531297484001-80022131f5a1")],
    variants: [{ storage: "1TB SSD", color: "Platinum", priceE: 142000, priceG: 135500, priceF: 129500 }],
  },
  {
    name: 'Lenovo ThinkPad T14 Gen 3 AMD',
    category: "laptops",
    brand: "Lenovo",
    description:
      "Mil‑spec toughness and TrackPoint favoured by Kenyan dev shops pairing with docking monitors.",
    whatsInBox: "ThinkPad T14, 65W USB‑C adapter, stylus slot empty.",
    featured: false,
    images: [img("photo-1525547719571-da2cac30bc13")],
    variants: [{ storage: "512GB SSD", color: "Black", priceE: 88900, priceG: 84500, priceF: 79900 }],
  },
  {
    name: 'iPad Air 11" — M2 chip Wi‑Fi',
    category: "tablets",
    brand: "Apple",
    description:
      "Thin canvas for Kenyan illustrators editing on the go with Apple Pencil (sold separately).",
    whatsInBox: "iPad Air, braided USB‑C cable, booklet.",
    featured: true,
    images: [img("photo-1544244015-0df4b3ffc6b0")],
    variants: [{ storage: "256GB", color: "Purple", priceE: 84900, priceG: 79900, priceF: 75900 }],
  },
  {
    name: 'Samsung Galaxy Tab S9 FE+ — 12.4"',
    category: "tablets",
    brand: "Samsung",
    description:
      "Inclusive S‑Pen stylus and Knox security for Kenyan schools transitioning to blended learning.",
    whatsInBox: "Tab with S‑Pen tucked in flap, charger, OTG adapter.",
    featured: false,
    images: [img("photo-1585790050230-9c5d94d5d4c9")],
    variants: [{ storage: "128GB", color: "Mint", priceE: 62900, priceG: 59900, priceF: 56500 }],
  },
  {
    name: 'Microsoft Surface Pro 9 — i5 LTE',
    category: "tablets",
    brand: "Microsoft",
    description:
      "Kickstand 2‑in‑1 with optional Type Cover compatible with Safaricom 4G hotspots when travelling.",
    whatsInBox: "Surface Pro chassis, detachable power brick, stylus not included.",
    featured: false,
    images: [img("photo-1611186871348-d6d4d6c5c79c")],
    variants: [{ storage: "256GB SSD", color: "Sapphire Blue", priceE: 115000, priceG: 108500, priceF: 103000 }],
  },
  {
    name: "Sony WH‑1000XM5 Headphones",
    category: "audio",
    brand: "Sony",
    description:
      "Industry reference active noise cancelling for long haul NBO–DXB commuters or noisy matatu corridors.",
    whatsInBox: "Headphones, hard carry shell, braided audio cable.",
    featured: true,
    images: [img("photo-1618366712019-f6686d5d0465")],
    variants: [{ storage: null, color: "Black Matte", priceE: 37900, priceG: 34500, priceF: 31500 }],
  },
  {
    name: 'JBL Flip 6 Waterproof Speaker',
    category: "audio",
    brand: "JBL",
    description:
      "PartyBoost stereo pairing for Kenyan outdoor weekends in Karura or Diani patios.",
    whatsInBox: "Flip 6, USB‑C cable, woven wrist strap.",
    featured: false,
    images: [img("photo-1608043152269-423db9884fdd")],
    variants: [{ storage: null, color: "Teal Reef", priceE: 16900, priceG: 15200, priceF: 13800 }],
  },
  {
    name: 'Anker Soundcore Liberty 4 NC',
    category: "audio",
    brand: "Anker",
    description:
      "Adaptive ANC earbuds with snug fit tuning for Kenyan gym routines and BRT commutes.",
    whatsInBox: "Earbuds, charging case with USB‑C.",
    featured: false,
    images: [img("photo-1590658268037-7b9007dbd6e3")],
    variants: [{ storage: null, color: "Navy Fibre", priceE: 12500, priceG: 11200, priceF: 10200 }],
  },
  {
    name: 'PlayStation 5 Slim Disc — 1TB',
    category: "gaming",
    brand: "Sony",
    description:
      "Ultra fast SSD rebuilt with fresh thermal pads for Kenyan apartment entertainment setups.",
    whatsInBox: "PS5 console, DualSense wireless controller, HDMI 2.1 cable, mains cable.",
    featured: true,
    images: [img("photo-1606144042614-b2417e99e4e9")],
    variants: [{ storage: "1TB SSD", color: "White", priceE: 86900, priceG: 82400, priceF: 78900 }],
  },
  {
    name: 'Xbox Series X — 1TB Carbon',
    category: "gaming",
    brand: "Microsoft",
    description:
      "Native 4K 60fps gaming pillar with expandable storage cage tested for Kenyan voltage conditioners.",
    whatsInBox: "Series X, Hyperkin compatible HDMI, Xbox wireless controller.",
    featured: false,
    images: [img("photo-1626248988883-fe6c789c6d6c")],
    variants: [{ storage: "1TB SSD", color: "Carbon Black", priceE: 79900, priceG: 75500, priceF: 71200 }],
  },
  {
    name: 'Nikon Z fc Mirrorless APS‑C Kit',
    category: "cameras",
    brand: "Nikon",
    description:
      "Retro dial body loved by Kenyan content creators transitioning from smartphone reels.",
    whatsInBox: "Z fc body, 16‑50mm kit lens, rechargeable EN‑EL25, charging dock.",
    featured: false,
    images: [img("photo-1502920917128-1aa500764cbd")],
    variants: [{ storage: "Body + 16‑50mm", color: "Black", priceE: 99500, priceG: 94500, priceF: 89200 }],
  },
  {
    name: 'Canon EOS R50 Vlogging Kit',
    category: "cameras",
    brand: "Canon",
    description:
      "Lightweight APS‑C RF mount camera with Rode mic‑ready shoe for Kenyan YouTube collectives.",
    whatsInBox: "Body, RF‑S 18‑45 lens, detachable mic windshield, reversible screen.",
    featured: false,
    images: [img("photo-1516035069371-29a1b244cc52")],
    variants: [{ storage: "APS‑C Mirrorless Kit", color: "Graphite Silver", priceE: 84900, priceG: 80500, priceF: 75900 }],
  },
  {
    name: 'Anker Nano II 67W Charger — 3‑Port GaN',
    category: "accessories",
    brand: "Anker",
    description:
      "Charges MacBook Air and flagship phones simultaneously via UK‑style plug ideal for Kenyan sockets.",
    whatsInBox: "GaN adaptor, braided USB‑C to C leads (2 pcs).",
    featured: false,
    images: [img("photo-1583863788433-15886e963dd9")],
    variants: [{ storage: null, color: "Space Grey", priceE: 8900, priceG: 8200, priceF: 7500 }],
  },
  {
    name: 'Spigen Tough Armor Case — iPhone 14',
    category: "accessories",
    brand: "Spigen",
    description:
      "Mil‑Grade dual layer shell with tactile buttons for Kenyan field technicians.",
    whatsInBox: "Single piece shell with installation guide QR.",
    featured: false,
    images: [img("photo-1601784551446-20c85e092e9f")],
    variants: [{ storage: null, color: "Carbon Black", priceE: 3500, priceG: 3200, priceF: 2980 }],
  },
  {
    name: 'Keychron K2 Pro Mechanical Keyboard — Hot‑swap Brown',
    category: "accessories",
    brand: "Keychron",
    description:
      "Compact 75% board with Bluetooth/USB toggles favoured by Kenyan remote engineering squads.",
    whatsInBox: "Keyboard, extra Mac/Win keycaps, USB‑C cable.",
    featured: false,
    images: [img("photo-1618384887928-ce16cbf6e6cf")],
    variants: [{ storage: null, color: "Aluminium Grey", priceE: 18900, priceG: 17500, priceF: 15900 }],
  },
  {
    name: 'Sony LinkBuds S — Carbon Neutral',
    category: "audio",
    brand: "Sony",
    description:
      "Featherweight ANC buds pairing quickly with Kenyan streaming bundles.",
    whatsInBox: "Buds case, XS/S/M silicon tips.",
    featured: false,
    images: [img("photo-1598331668826-c45c4c5d3886")],
    variants: [{ storage: null, color: "White Mist", priceE: 22900, priceG: 20800, priceF: 19200 }],
  },
  {
    name: 'Nintendo Switch OLED — White Dock',
    category: "gaming",
    brand: "Nintendo",
    description:
      "Refurb OLED panel calibrated for Kenyan living rooms plus parental controls onboarding.",
    whatsInBox: "Switch OLED, Joy‑Con controllers, HDMI, dock PSU.",
    featured: false,
    images: [img("photo-1578662996449-93f83727abf5")],
    variants: [{ storage: "64GB onboard", color: "White Trim", priceE: 56900, priceG: 53500, priceF: 50500 }],
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.setting.deleteMany();

  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.create({
    data: {
      email: "admin@refurbke.ke",
      passwordHash: hashed,
      name: "Lead Operator",
    },
  });

  const demoUserHash = await bcrypt.hash("buyer123", 10);
  await prisma.user.create({
    data: {
      email: "winnie@example.co.ke",
      fullName: "Winnie Njeri",
      phone: "0712345678",
      passwordHash: demoUserHash,
    },
  });

  for (const c of cats) {
    await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        iconUrl:
          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(c.slug)}&backgroundColor=f7f7f7`,
      },
    });
  }

  const slugify = (n) =>
    String(n || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  for (const b of brandsList) {
    await prisma.brand.create({ data: { name: b, slug: slugify(b) } });
  }

  const catsDb = await prisma.category.findMany();
  const brandsDb = await prisma.brand.findMany();

  const catId = (slug) => catsDb.find((x) => x.slug === slug).id;
  const brandId = (name) => brandsDb.find((x) => x.name === name).id;

  for (const p of productsData) {
    const metaTitle = `Buy ${p.name} refurbished in Kenya | RefurbKE`;
    const metaDescription = `${p.description.slice(0, 148)}…`;
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description,
        whatsInBox: p.whatsInBox,
        specs: {
          Warranty: "12 months dealer warranty RefurbKE",
          Region: "Tested with Kenyan mains (240V) where applicable",
        },
        categoryId: catId(p.category),
        brandId: brandId(p.brand),
        featured: !!p.featured,
        metaTitle,
        metaDescription,
        variants: {
          create: p.variants.flatMap((v) => [
            {
              storage: v.storage,
              color: v.color,
              priceExcellent: v.priceE,
              priceGood: v.priceG,
              priceFair: v.priceF,
              stockExcellent: 4 + Math.floor(Math.random() * 4),
              stockGood: 3 + Math.floor(Math.random() * 3),
              stockFair: 2 + Math.floor(Math.random() * 3),
            },
          ]),
        },
        images: {
          create: p.images.map((url, i) => ({ url, sortOrder: i })),
        },
      },
    });

    console.log(`Seeded ${product.slug}`);
  }

  await prisma.setting.createMany({
    data: [
      { key: "store_name", value: "RefurbKE" },
      { key: "contact_email", value: "support@refurbke.ke" },
      { key: "shipping_nairobi", value: "350" },
      { key: "shipping_upcountry", value: "600" },
      { key: "mpesa_shortcode", value: "" },
      { key: "mpesa_passkey", value: "" },
      { key: "mpesa_consumer_key", value: "" },
      { key: "mpesa_consumer_secret", value: "" },
      { key: "pesapal_consumer_key", value: "" },
      { key: "pesapal_consumer_secret", value: "" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
