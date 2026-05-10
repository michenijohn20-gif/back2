import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const key = `${item.variantId}-${item.condition}`;
        const existing = get().items.find(
          (i) => `${i.variantId}-${i.condition}` === key,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              `${i.variantId}-${i.condition}` === key
                ? { ...i, quantity: Math.min(10, i.quantity + (item.quantity || 1)) }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: item.quantity || 1 }] });
        }
      },
      setQty: (variantId, condition, quantity) => {
        const q = Math.max(1, Math.min(10, Number(quantity) || 1));
        set({
          items: get().items.map((i) =>
            i.variantId === variantId && i.condition === condition ? { ...i, quantity: q } : i,
          ),
        });
      },
      removeItem: (variantId, condition) => {
        set({
          items: get().items.filter(
            (i) => !(i.variantId === variantId && i.condition === condition),
          ),
        });
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "refurbke-cart" },
  ),
);
