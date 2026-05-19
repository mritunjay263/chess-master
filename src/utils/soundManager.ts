// src/utils/soundManager.ts
import { Audio } from 'expo-av';
import { useSettingsStore } from '../store/settingsStore';

type SKey = 'move_self'|'move_opponent'|'capture'|'check'|'castle'|'promote'|'game_start'|'game_end_win'|'game_end_lose'|'draw'|'tick'|'notify';
const sounds: Partial<Record<SKey, Audio.Sound>> = {};

// Sounds are optional — if a file is missing the app still works
const FILES: Partial<Record<SKey, any>> = {};
try {
  Object.assign(FILES, {
    move_self: require('../assets/sounds/move_self.mp3'),
    move_opponent: require('../assets/sounds/move_opponent.mp3'),
    capture: require('../assets/sounds/capture.mp3'),
    check: require('../assets/sounds/check.mp3'),
    castle: require('../assets/sounds/castle.mp3'),
    promote: require('../assets/sounds/promote.mp3'),
    game_start: require('../assets/sounds/game_start.mp3'),
    game_end_win: require('../assets/sounds/game_end_win.mp3'),
    game_end_lose: require('../assets/sounds/game_end_lose.mp3'),
    draw: require('../assets/sounds/draw.mp3'),
    tick: require('../assets/sounds/tick.mp3'),
    notify: require('../assets/sounds/notify.mp3'),
  });
} catch {}

export async function preloadSounds() {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
  await Promise.allSettled(
    (Object.entries(FILES) as [SKey, any][]).map(async ([k, src]) => {
      const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
      sounds[k] = sound;
    })
  );
}

export async function playSound(key: SKey) {
  const { settings } = useSettingsStore.getState();
  if (!settings.soundEnabled) return;
  try {
    await sounds[key]?.setVolumeAsync(settings.volume);
    await sounds[key]?.replayAsync();
  } catch {}
}

export async function unloadSounds() {
  await Promise.allSettled(Object.values(sounds).map(s => s?.unloadAsync()));
}
