// src/utils/hapticManager.ts
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSettingsStore } from '../store/settingsStore';

type HType = 'impactLight'|'impactMedium'|'impactHeavy'|'notificationWarning'|'notificationSuccess'|'notificationError'|'selection';
const OPT = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

export function triggerHaptic(type: HType, repeat = 1) {
  if (!useSettingsStore.getState().settings.hapticsEnabled) return;
  for (let i = 0; i < repeat; i++) ReactNativeHapticFeedback.trigger(type, OPT);
}
