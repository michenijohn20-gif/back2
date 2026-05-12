import api from "./api";
import { cacheKey, readSessionCache, writeSessionCache } from "./requestCache.js";

export const PRODUCT_CACHE_TTL_MS = 2 * 60_000;
export const PRODUCT_STALE_CACHE_TTL_MS = 24 * 60 * 60_000;

export const DEFAULT_CATALOG_PARAMS = {
  page: 1,
  pageSize: 12,
  sort: "featured",
  condition: "EXCELLENT",
};

const inFlight = new Map();

export function productCacheKey(params = {}) {
  return cacheKey("catalog:products", normalizeProductParams(params));
}

export function prefetchProducts(params = {}) {
  const requestParams = normalizeProductParams({
    ...DEFAULT_CATALOG_PARAMS,
    ...params,
  });
  const key = productCacheKey(requestParams);

  if (readSessionCache(key, PRODUCT_CACHE_TTL_MS)) {
    return Promise.resolve(null);
  }
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const request = api
    .get("/api/products", { params: requestParams })
    .then((response) => {
      const next = {
        products: response.data.products || [],
        total: response.data.total || 0,
      };
      writeSessionCache(key, next);
      return next;
    })
    .catch(() => null)
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

export function normalizeProductParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
}
