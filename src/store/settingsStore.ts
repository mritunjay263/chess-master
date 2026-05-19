// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { AppSettings } from '../types';

const mmkv = new MMKV({ id: 'settings-store' });
const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

const defaults: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  showLegalMoves: true,
  showLastMove: true,
  boardTheme: 'Classic',
};

interface SettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(persist(
  (set) => ({
    settings: defaults,
    updateSetting: (key, value) => set(s => ({ settings: { ...s.settings, [key]: value } })),
  }),
  {
    name: 'settings-store',
    storage: createJSONStorage(() => mmkvStorage),
  },
));
