// src/store/settingsStore.ts
// FIX: added volume field (was missing — soundManager reads settings.volume
//      and called setVolumeAsync(undefined) which threw an error)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { AppSettings } from '../types';

const mmkv = new MMKV({ id: 'settings-store' });
const mmkvStorage = {
  getItem:    (key: string)         => mmkv.getString(key) ?? null,
  setItem:    (key: string, v: string) => mmkv.set(key, v),
  removeItem: (key: string)         => mmkv.delete(key),
};

const defaults: AppSettings = {
  soundEnabled:   true,
  hapticsEnabled: true,
  showLegalMoves: true,
  showLastMove:   true,
  boardTheme:     'Classic',
  volume:         1.0,   // FIX: was missing — 0.0–1.0 range
};

interface SettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(persist(
  (set) => ({
    settings: defaults,
    updateSetting: (key, value) =>
      set(s => ({ settings: { ...s.settings, [key]: value } })),
  }),
  {
    name: 'settings-store',
    storage: createJSONStorage(() => mmkvStorage),
  },
));
