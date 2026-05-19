// src/store/settingsStore.ts
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { AppSettings } from '../types';

export const storage = new MMKV({ id: 'chess-settings' });
const KEY = 'app_settings';
const DEFAULTS: AppSettings = {
  soundEnabled: true, volume: 0.8, hapticsEnabled: true,
  boardTheme: 'Classic', pieceTheme: 'Merida',
  showLegalMoves: true, showLastMove: true,
};
function load(): AppSettings {
  try { return { ...DEFAULTS, ...JSON.parse(storage.getString(KEY) ?? '{}') }; }
  catch { return DEFAULTS; }
}
interface Store { settings: AppSettings; updateSetting: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void; resetSettings: () => void; }
export const useSettingsStore = create<Store>((set) => ({
  settings: load(),
  updateSetting: (k, v) => set((s) => {
    const updated = { ...s.settings, [k]: v };
    storage.set(KEY, JSON.stringify(updated));
    return { settings: updated };
  }),
  resetSettings: () => { storage.set(KEY, JSON.stringify(DEFAULTS)); set({ settings: DEFAULTS }); },
}));
