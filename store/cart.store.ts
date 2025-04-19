import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartDto } from '@/domain/dtos';


interface CartState {
  cart: CartDto | null;
  setCartDto: (cart: CartDto) => void;
  clearCart: () => void;
  getCartDto: () => CartDto | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      setCartDto: (cart) => set({ cart }),
      clearCart: () => set({ cart: null }),
      getCartDto: () => get().cart,
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
