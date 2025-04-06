import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartDto } from '@/domain/dtos';


interface CartState {
  cart: CartDto | null;
  setCart: (cart: CartDto) => void;
  clearCart: () => void;
  getCart: () => CartDto | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
      getCart: () => get().cart,
    }),
    {
      name: 'cart-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
