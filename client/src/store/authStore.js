import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "../lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (payload) => {
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken ?? get().refreshToken,
        });
        setAuthToken(payload.accessToken);
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        setAuthToken(null);
      },
      hydrateToken: () => {
        const t = get().accessToken;
        setAuthToken(t || null);
      },
    }),
    { name: "refurbke-auth" },
  ),
);
