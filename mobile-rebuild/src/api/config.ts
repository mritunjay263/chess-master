// src/api/config.ts — runtime endpoint configuration
// For same-network (LAN) testing, use your machine's LAN IP.
// For remote (non-LAN) testing, use ngrok: npx ngrok http 3000
// then paste the https URL below.
const HOST = '192.168.1.7'; // your Mac's current LAN IP
const PORT = 3000;

export const API_CONFIG = {
  BASE_URL: `http://${HOST}:${PORT}`,
  SOCKET_URL: `http://${HOST}:${PORT}`,
  TIMEOUT_MS: 15_000,
};
