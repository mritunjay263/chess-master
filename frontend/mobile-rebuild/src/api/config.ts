// ============================================================
// src/api/config.ts — API base URLs
// ============================================================
import { Platform } from 'react-native';

// Use 10.0.2.2 on Android emulator (maps to host machine localhost)
// Use localhost on iOS simulator
// Override HARDCODED_HOST with your LAN IP for physical device testing
const HARDCODED_HOST: string | null = null; // e.g. '192.168.1.42'

const DEFAULT_HOST =
  HARDCODED_HOST ??
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL = `http://${DEFAULT_HOST}:3000`;
export const SOCKET_URL   = `http://${DEFAULT_HOST}:3000`;
