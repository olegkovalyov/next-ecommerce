import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isLogged: boolean;
  setAuthenticated: (isLogged: boolean) => void,
  isAuthenticated: () => boolean,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLogged: false,
      setAuthenticated: (isLogged: boolean) => set({ isLogged }),
      isAuthenticated: () => get().isLogged,
    }),
    {
      name: 'auth-storage',
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
