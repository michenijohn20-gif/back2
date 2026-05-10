import { prisma } from "../prisma.js";
import { NAIROBI_COUNTY } from "../data/kenyanCounties.js";

export const SETTING_KEYS = {
  SHIPPING_NAIROBI: "shipping_nairobi",
  SHIPPING_UPCOUNTRY: "shipping_upcountry",
  STORE_NAME: "store_name",
  CONTACT_EMAIL: "contact_email",
};

export async function getSetting(key, fallback) {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return row.value;
}

export async function setSetting(key, value) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

export async function shippingRates() {
  const nairobi = Number(await getSetting(SETTING_KEYS.SHIPPING_NAIROBI, "350")) || 350;
  const up = Number(await getSetting(SETTING_KEYS.SHIPPING_UPCOUNTRY, "600")) || 600;
  return { nairobiRate: nairobi, upcountryRate: up };
}

export function shippingAmountForCounty(county, rates) {
  const c = county?.trim();
  if (!c) return rates.upcountryRate;
  return c === NAIROBI_COUNTY ? rates.nairobiRate : rates.upcountryRate;
}
