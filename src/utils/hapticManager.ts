// src/utils/hapticManager.ts
// FIX: ignoreAndroidSystemSettings: true — haptics fire even if Android
//      vibration is off in system settings (matches chess app UX expectation)
// FIX: repeated haptics use setTimeout spacing so pulses don't overlap/cancel
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSettingsStore } from '../store/settingsStore';

type HType =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationWarning'
  | 'notificationSuccess'
  | 'notificationError'
  | 'selection';

// FIX: ignoreAndroidSystemSettings: true for reliable haptics on Android
const OPT = {
  enableVibrateFallback:      true,
  ignoreAndroidSystemSettings: true,
};

/**
 * Trigger a haptic pattern.
 * @param type   Haptic type
 * @param repeat Number of pulses (default 1). Each pulse is spaced 80 ms apart
 *               so they don't overlap and cancel each other.
 */
export function triggerHaptic(type: HType, repeat = 1): void {
  if (!useSettingsStore.getState().settings.hapticsEnabled) return;
  if (repeat <= 1) {
    ReactNativeHapticFeedback.trigger(type, OPT);
    return;
  }
  // Space out pulses 80 ms apart so each one completes before the next starts
  for (let i = 0; i < repeat; i++) {
    setTimeout(() => {
      ReactNativeHapticFeedback.trigger(type, OPT);
    }, i * 80);
  }
}
