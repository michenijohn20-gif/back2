export function isValidKenyaPhone(raw) {
  const d = String(raw || "").replace(/\s+/g, "");
  if (/^\+254[17]\d{8}$/.test(d)) return true;
  if (/^0[17]\d{8}$/.test(d)) return true;
  return false;
}
