// src/api/config.ts — runtime endpoint configuration
// Use your machine's LAN IP for physical device testing (same network)
const HOST = '192.168.1.7'; // matches Expo's detected IP

export const API_CONFIG = {
  // Override via env at build time or remote config in production
  BASE_URL: `http://${HOST}:3000`,
  SOCKET_URL: `http://${HOST}:3000`,
  TIMEOUT_MS: 15_000,
};
