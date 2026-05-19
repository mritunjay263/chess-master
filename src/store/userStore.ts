// src/store/userStore.ts — persists token via MMKV
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { User } from '../types';

const mmkv = new MMKV({ id: 'user-store' });
const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

interface UserState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  setUser: (user: User, isGuest?: boolean) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(persist(
  (set) => ({
    user: null,
    token: null,
    isGuest: false,
    setUser: (user, isGuest = false) => set({ user, isGuest }),
    setToken: (token) => set({ token }),
    logout: () => set({ user: null, token: null, isGuest: false }),
  }),
  {
    name: 'user-store',
    storage: createJSONStorage(() => mmkvStorage),
    partialize: (s) => ({ user: s.user, token: s.token, isGuest: s.isGuest }),
  },
));
