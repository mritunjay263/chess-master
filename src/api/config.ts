// src/api/config.ts
import { Platform } from 'react-native';
// Android emulator needs 10.0.2.2 to reach host machine's localhost
export const BACKEND_URL =
  __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3001'
      : 'http://localhost:3001'
    : 'https://your-production-server.com';
