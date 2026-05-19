// ============================================================
// src/store/storage.ts — MMKV singleton for persistent storage
// ============================================================
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'chess-master-storage' });

// Helper wrappers that match Zustand's persist middleware API
export const mmkvStorage = {
  getItem: (key: string): string | null => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};
