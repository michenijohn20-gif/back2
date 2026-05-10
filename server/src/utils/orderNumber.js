import { randomBytes } from "crypto";

export function generateOrderNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `RK-${t}-${r}`;
}
