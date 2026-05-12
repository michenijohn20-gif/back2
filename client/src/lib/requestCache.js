const DEFAULT_TTL_MS = 45_000;
const DEFAULT_STALE_TTL_MS = 24 * 60 * 60_000;

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
  const cached = readCacheEntry(key);
  if (!cached || Date.now() - cached.time > ttlMs) return null;
  return cached.value;
}

export function readStaleSessionCache(key, ttlMs = DEFAULT_TTL_MS, staleTtlMs = DEFAULT_STALE_TTL_MS) {
  if (typeof window === "undefined") return null;
  const cached = readCacheEntry(key);
  if (!cached) return null;
  const age = Date.now() - cached.time;
  if (age > staleTtlMs) return null;
  return { value: cached.value, stale: age > ttlMs, age };
}

export function writeSessionCache(key, value) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ time: Date.now(), value });
  writeStorage(getStorage("sessionStorage"), key, payload);
  writeStorage(getStorage("localStorage"), key, payload);
}

function readCacheEntry(key) {
  const sessionValue = readStorage(getStorage("sessionStorage"), key);
  const localValue = readStorage(getStorage("localStorage"), key);
  if (!sessionValue) return localValue;
  if (!localValue) return sessionValue;
  return sessionValue.time >= localValue.time ? sessionValue : localValue;
}

function getStorage(name) {
  try {
    return window[name];
  } catch {
    return null;
  }
}

function readStorage(storage, key) {
  try {
    const raw = storage?.getItem(key);
    const cached = raw ? JSON.parse(raw) : null;
    if (!cached || typeof cached.time !== "number") return null;
    return cached;
  } catch {
    return null;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Ignore quota/security errors; the network request already succeeded.
  }
}
