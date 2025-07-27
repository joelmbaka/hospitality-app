import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storageImpl from './cartStorage';

export type CartItem = { id: string; item: any; qty: number };

interface CartState {
  items: Record<string, CartItem>;
  mealTime: Date | null;
  add: (item: any) => void;
  remove: (id: string) => void;
  clear: () => void;
  setMealTime: (d: Date) => void;
  total: () => number;
}

const storage = createJSONStorage(() => storageImpl as any);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({      
      items: {},
      mealTime: null,
      add: (item) =>
        set((s) => {
          const existing = s.items[item.id];
          return {
            items: {
              ...s.items,
              [item.id]: {
                id: item.id,
                item,
                qty: existing ? existing.qty + 1 : 1,
              },
            },
          };
        }),
      remove: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.items;
          return { items: rest };
        }),
      clear: () => set({ items: {}, mealTime: null }),
      setMealTime: (d) => set({ mealTime: d }),
      total: () =>
        Object.values(get().items).reduce(
          (sum, { item, qty }) => sum + (Number(item.price) || 0) * qty,
          0
        ),
    }),
    {
      name: 'cart-storage',
      storage,
    }
  )
);
