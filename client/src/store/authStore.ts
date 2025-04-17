import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  username: string;
  role: string;
};

type AuthState = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'travel-crm-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
