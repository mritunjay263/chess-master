// ============================================================
// src/store/userStore.ts — Auth / user state with MMKV persist
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import type { User } from '../types';

interface UserStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  setGuest: (username: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      setGuest: (username) => {
        // Create a local-only guest user with a random ID
        const guest: User = {
          id: `guest_${Date.now()}`,
          username,
          rating: 1200,
          isGuest: true,
        };
        set({ user: guest, token: null, isAuthenticated: true });
      },

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
