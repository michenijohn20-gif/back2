const DEFAULT_TTL_MS = 45_000;

export function cacheKey(scope, params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params)
    .filter(([, value]) => value !== "" && value != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => sp.set(key, String(value)));
  const suffix = sp.toString();
  return suffix ? `${scope}:${suffix}` : scope;
}

export function readSessionCache(key, ttlMs = DEFAULT_TTL_MS) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    const cached = raw ? JSON.parse(raw) : null;
    if (!cached || Date.now() - cached.time > ttlMs) return null;
    return cached.value;
  } catch {
    return null;
  }
}

export function writeSessionCache(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), value }));
  } catch {
    // Ignore quota/security errors; the network request already succeeded.
  }
}
