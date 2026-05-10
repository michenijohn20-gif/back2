import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAdminApiToken } from "../lib/adminApi";

export const useAdminStore = create(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      setSession: ({ token, admin }) => {
        set({ token, admin });
        setAdminApiToken(token);
      },
      logout: () => {
        set({ token: null, admin: null });
        setAdminApiToken(null);
      },
      hydrate: () => setAdminApiToken(get().token || null),
    }),
    { name: "refurbke-admin" },
  ),
);
