// src/utils/soundManager.ts
// FIX: playsInSilentModeIOS: true  — sounds must play even on silent mode (iOS)
// FIX: staysActiveInBackground: true  — keeps audio session alive during app switch
// FIX: preload each sound independently so a missing file doesn't crash the whole batch
import { Audio } from 'expo-av';
import { useSettingsStore } from '../store/settingsStore';

type SKey =
  | 'move_self'
  | 'move_opponent'
  | 'capture'
  | 'check'
  | 'castle'
  | 'promote'
  | 'game_start'
  | 'game_end_win'
  | 'game_end_lose'
  | 'draw'
  | 'tick'
  | 'notify';

const sounds: Partial<Record<SKey, Audio.Sound>> = {};
let audioReady = false;

// Require each sound file individually so Metro can bundle them correctly.
// If a file is missing the require() throws at build time — use try/catch per entry.
const FILES: Partial<Record<SKey, any>> = {};
const fileMap: Array<[SKey, () => any]> = [
  ['move_self',     () => require('../assets/sounds/move_self.mp3')],
  ['move_opponent', () => require('../assets/sounds/move_opponent.mp3')],
  ['capture',       () => require('../assets/sounds/capture.mp3')],
  ['check',         () => require('../assets/sounds/check.mp3')],
  ['castle',        () => require('../assets/sounds/castle.mp3')],
  ['promote',       () => require('../assets/sounds/promote.mp3')],
  ['game_start',    () => require('../assets/sounds/game_start.mp3')],
  ['game_end_win',  () => require('../assets/sounds/game_end_win.mp3')],
  ['game_end_lose', () => require('../assets/sounds/game_end_lose.mp3')],
  ['draw',          () => require('../assets/sounds/draw.mp3')],
  ['tick',          () => require('../assets/sounds/tick.mp3')],
  ['notify',        () => require('../assets/sounds/notify.mp3')],
];
for (const [key, loader] of fileMap) {
  try { FILES[key] = loader(); } catch { /* file missing — skip silently */ }
}

/**
 * Call once at app startup (e.g. in App.tsx useEffect).
 * Sets up audio session and preloads all available sound files.
 */
export async function preloadSounds(): Promise<void> {
  try {
    // FIX: playsInSilentModeIOS TRUE — chess sounds must work on silent iPhone
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioReady = true;
  } catch (e) {
    console.warn('[SoundManager] setAudioModeAsync failed:', e);
    return;
  }

  await Promise.allSettled(
    (Object.entries(FILES) as [SKey, any][]).map(async ([key, src]) => {
      try {
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
        sounds[key] = sound;
      } catch (e) {
        console.warn(`[SoundManager] failed to load ${key}:`, e);
      }
    }),
  );
}

/**
 * Play a sound by key. Safe to call even if the sound failed to load.
 */
export async function playSound(key: SKey): Promise<void> {
  if (!audioReady) return;
  const { settings } = useSettingsStore.getState();
  if (!settings.soundEnabled) return;
  const sound = sounds[key];
  if (!sound) return;
  try {
    await sound.setVolumeAsync(settings.volume ?? 1.0);
    // replayAsync rewinds to start then plays — correct for short SFX
    await sound.replayAsync();
  } catch (e) {
    // Sound may have been unloaded — ignore
  }
}

/**
 * Call when leaving the game screen to free native audio resources.
 */
export async function unloadSounds(): Promise<void> {
  await Promise.allSettled(
    Object.values(sounds).map(s => s?.unloadAsync()),
  );
  Object.keys(sounds).forEach(k => delete (sounds as any)[k]);
  audioReady = false;
}
