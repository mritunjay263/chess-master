// src/api/config.ts
// ─── URL resolution priority ──────────────────────────────────────────────
// 1. EXPO_PUBLIC_API_URL in .env  → wins always (tunnel / LAN / prod)
// 2. Android emulator fallback    → http://10.0.2.2:3001
// 3. iOS simulator fallback       → http://localhost:3001
//
// ⚠️  IMPORTANT for Expo tunnel:
//   Copy .env.example → .env and set:
//   EXPO_PUBLIC_API_URL=https://YOUR-TUNNEL-URL.exp.direct
//   Then restart with:  npx expo start --tunnel --clear
//
// ⚠️  Backend PORT is 3001 (see backend/.env).
//   If you change the backend port, update EXPO_PUBLIC_API_URL accordingly.
import { Platform } from 'react-native';

const fromEnv: string = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();

const devFallback =
  Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export const BACKEND_URL: string =
  fromEnv.length > 0 ? fromEnv : __DEV__ ? devFallback : 'https://your-production-server.com';

export const SOCKET_URL = BACKEND_URL;

console.log('[Config] BACKEND_URL =', BACKEND_URL);
