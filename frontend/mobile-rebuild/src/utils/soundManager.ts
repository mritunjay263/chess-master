// src/utils/soundManager.ts — preloads sounds via expo-audio, plays on demand
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { SOUND_KEYS, type SoundKey } from '@/constants/sounds';
import { useSettingsStore } from '@store/settingsStore';

// Map sound keys to require() calls. Expo bundles these at compile time.
// Place mp3 files in src/assets/sounds/
const SOUND_FILES: Record<SoundKey, any> = {
  'move_self.mp3': require('@assets/sounds/move_self.mp3'),
  'move_opponent.mp3': require('@assets/sounds/move_opponent.mp3'),
  'capture.mp3': require('@assets/sounds/capture.mp3'),
  'check.mp3': require('@assets/sounds/check.mp3'),
  'castle.mp3': require('@assets/sounds/castle.mp3'),
  'promote.mp3': require('@assets/sounds/promote.mp3'),
  'game_start.mp3': require('@assets/sounds/game_start.mp3'),
  'game_end_win.mp3': require('@assets/sounds/game_end_win.mp3'),
  'game_end_lose.mp3': require('@assets/sounds/game_end_lose.mp3'),
  'draw.mp3': require('@assets/sounds/draw.mp3'),
  'tick.mp3': require('@assets/sounds/tick.mp3'),
  'notify.mp3': require('@assets/sounds/notify.mp3'),
};

class SoundManager {
  private cache = new Map<SoundKey, AudioPlayer>();
  private loaded = false;

  /** Preload every sound at app start. Safe to call multiple times. */
  async preload(): Promise<void> {
    if (this.loaded) return;
    // Configure audio mode: mix with other apps, don't play in silent mode
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldRouteThroughEarpiece: false,
    });
    const keys = Object.values(SOUND_KEYS);
    for (const key of keys) {
      try {
        const file = SOUND_FILES[key];
        if (!file) continue;
        const player = createAudioPlayer(file);
        this.cache.set(key, player);
      } catch {
        // A missing sound shouldn't block app launch
      }
    }
    this.loaded = true;
  }

  async play(key: SoundKey): Promise<void> {
    const { soundEnabled, volume } = useSettingsStore.getState();
    if (!soundEnabled) return;
    const player = this.cache.get(key);
    if (!player) return;
    try {
      player.volume = Math.max(0, Math.min(1, volume));
      await player.seekTo(0);
      player.play();
    } catch {
      // Ignore playback errors
    }
  }

  async unloadAll(): Promise<void> {
    for (const player of this.cache.values()) {
      try { player.remove(); } catch { /* ignore */ }
    }
    this.cache.clear();
    this.loaded = false;
  }
}

export const soundManager = new SoundManager();
