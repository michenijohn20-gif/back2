export function formatKes(amount) {
  const n = Number(amount) || 0;
  return `KES ${n.toLocaleString("en-KE")}`;
}
