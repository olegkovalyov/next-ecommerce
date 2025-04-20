import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartDto } from '@/domain/dtos';

interface CartState {
  cart: CartDto;
  setCartDto: (cart: CartDto) => void;
  clearCart: () => void;
  getCartDto: () => CartDto;
}

const createDefaultCart = () => {
  const defaultCart: CartDto = {
    id: crypto.randomUUID(),
    userId: null,
    taxPercentage: 0,
    cartItemDtos: [],
  };
  return defaultCart;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: createDefaultCart(),
      setCartDto: (cart) => set({ cart }),
      clearCart: () => set({ cart: createDefaultCart() }),
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
    },
  ),
);
