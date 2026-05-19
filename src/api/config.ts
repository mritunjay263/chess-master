// src/api/config.ts
// FIX: With Expo tunnel the device cannot reach localhost or 10.0.2.2.
// EXPO_PUBLIC_API_URL must be set to the tunnel URL (https://xxxx.exp.direct)
// or your LAN IP (http://192.168.x.x:3001) when testing on a physical device.
//
// Priority order:
//   1. EXPO_PUBLIC_API_URL env var (set in .env, works for tunnel + LAN + prod)
//   2. Android emulator fallback: 10.0.2.2:3001
//   3. iOS simulator fallback: localhost:3001
import { Platform } from 'react-native';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;

export const BACKEND_URL: string =
  fromEnv && fromEnv.length > 0
    ? fromEnv  // tunnel URL or LAN IP — always wins
    : __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3001'
      : 'http://localhost:3001'
    : 'https://your-production-server.com';

// Convenience re-export so any file can import from one place
export const SOCKET_URL = BACKEND_URL;
