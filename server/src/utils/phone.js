export function normalizeKenyaPhone(raw) {
  const s = String(raw || "").replace(/\s+/g, "");
  return s.replace(/^\+254/, "0");
}

/** Accepts 07XXXXXXXX, 01XXXXXXXX, +2547/1XXXXXXXX */
export function isValidKenyaPhone(raw) {
  const d = String(raw || "").replace(/\s+/g, "");
  if (/^\+254[17]\d{8}$/.test(d)) return true;
  if (/^0[17]\d{8}$/.test(d)) return true;
  return false;
}

export function formattedForMpesa(raw) {
  const d = String(raw || "").replace(/\s+/g, "");
  if (/^\+254[17]\d{8}$/.test(d)) return d.replace("+254", "254");
  if (/^0[17]\d{8}$/.test(d)) return `254${d.slice(1)}`;
  return "";
}
