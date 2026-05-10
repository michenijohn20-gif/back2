import axios from "axios";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export function setAdminApiToken(token) {
  if (token) {
    adminApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete adminApi.defaults.headers.common.Authorization;
  }
}
