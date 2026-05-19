// src/utils/soundManager.ts
// FIX: playsInSilentModeIOS: true  → sounds play even on iPhone silent mode
// FIX: safe volume read with fallback (settings.volume ?? 1.0)
// FIX: per-file try/catch so a missing mp3 never crashes the whole batch
import { Audio } from 'expo-av';
import { useSettingsStore } from '../store/settingsStore';

type SKey =
  | 'move_self' | 'move_opponent' | 'capture' | 'check'
  | 'castle' | 'promote' | 'game_start' | 'game_end_win'
  | 'game_end_lose' | 'draw' | 'tick' | 'notify';

const sounds: Partial<Record<SKey, Audio.Sound>> = {};
let _ready = false;

// Load each file in a separate try/catch so a missing file is a warning, not a crash
const FILE_LOADERS: Array<[SKey, () => any]> = [
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

const FILES: Partial<Record<SKey, any>> = {};
for (const [key, load] of FILE_LOADERS) {
  try { FILES[key] = load(); } catch { /* file missing — skip */ }
}

export async function preloadSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS:   true,   // FIX: must be true — plays on silent iPhone
      staysActiveInBackground: false,
      shouldDuckAndroid:       true,
    });
    _ready = true;
  } catch (e) {
    console.warn('[Sound] setAudioModeAsync failed:', e);
    return;
  }

  await Promise.allSettled(
    (Object.entries(FILES) as [SKey, any][]).map(async ([key, src]) => {
      try {
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
        sounds[key] = sound;
        console.log('[Sound] loaded:', key);
      } catch (e) {
        console.warn('[Sound] failed to load', key, e);
      }
    }),
  );
  console.log('[Sound] preload complete. Loaded:', Object.keys(sounds).join(', '));
}

export async function playSound(key: SKey): Promise<void> {
  if (!_ready) return;
  const { settings } = useSettingsStore.getState();
  if (!settings.soundEnabled) return;
  const sound = sounds[key];
  if (!sound) return;
  try {
    const vol = typeof settings.volume === 'number' ? settings.volume : 1.0; // FIX: safe fallback
    await sound.setVolumeAsync(vol);
    await sound.replayAsync();
  } catch { /* sound unloaded or unavailable */ }
}

export async function unloadSounds(): Promise<void> {
  await Promise.allSettled(Object.values(sounds).map(s => s?.unloadAsync()));
  (Object.keys(sounds) as SKey[]).forEach(k => delete sounds[k]);
  _ready = false;
}
