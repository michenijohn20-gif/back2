import axios from "axios";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

const ADMIN_STORAGE_KEY = "refurbke-admin";
export const ADMIN_UNAUTHORIZED_EVENT = "refurbke:admin-unauthorized";

function readPersistedAdminToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
}

export function setAdminApiToken(token) {
  if (token) {
    adminApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete adminApi.defaults.headers.common.Authorization;
  }
}

adminApi.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const token = readPersistedAdminToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      setAdminApiToken(null);
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
      window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
