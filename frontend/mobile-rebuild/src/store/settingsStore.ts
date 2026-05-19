// ============================================================
// src/store/settingsStore.ts — App settings with MMKV persist
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';
import type { SettingsState } from '../types';

interface SettingsStore extends SettingsState {
  setSoundEnabled: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setHapticsEnabled: (v: boolean) => void;
  setShowLegalMoves: (v: boolean) => void;
  setShowLastMove: (v: boolean) => void;
  setBoardTheme: (v: SettingsState['boardTheme']) => void;
  setPieceTheme: (v: SettingsState['pieceTheme']) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Defaults
      soundEnabled: true,
      soundVolume: 0.8,
      hapticsEnabled: true,
      showLegalMoves: true,
      showLastMoveHighlight: true,
      boardTheme: 'classic',
      pieceTheme: 'merida',

      setSoundEnabled:   (v) => set({ soundEnabled: v }),
      setSoundVolume:    (v) => set({ soundVolume: v }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setShowLegalMoves: (v) => set({ showLegalMoves: v }),
      setShowLastMove:   (v) => set({ showLastMoveHighlight: v }),
      setBoardTheme:     (v) => set({ boardTheme: v }),
      setPieceTheme:     (v) => set({ pieceTheme: v }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
