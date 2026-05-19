// src/utils/hapticManager.ts
// FIX: ignoreAndroidSystemSettings: true → reliable on Android
// FIX: repeated pulses spaced 80ms so they don't overlap/cancel
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSettingsStore } from '../store/settingsStore';

type HType =
  | 'impactLight' | 'impactMedium' | 'impactHeavy'
  | 'notificationWarning' | 'notificationSuccess' | 'notificationError'
  | 'selection';

const OPT = {
  enableVibrateFallback:       true,
  ignoreAndroidSystemSettings: true, // FIX: fire even if Android vibration is off
};

export function triggerHaptic(type: HType, repeat = 1): void {
  if (!useSettingsStore.getState().settings.hapticsEnabled) return;
  if (repeat <= 1) {
    ReactNativeHapticFeedback.trigger(type, OPT);
    return;
  }
  // FIX: space pulses 80ms apart so each one finishes before next starts
  for (let i = 0; i < repeat; i++) {
    setTimeout(() => ReactNativeHapticFeedback.trigger(type, OPT), i * 80);
  }
}
