import Constants from 'expo-constants';

const PORT = 3000;

// Hardcode your machine's LAN IP here for devices (e.g. '192.168.1.100').
// Set to empty string to auto-detect.
const HARDCODED_HOST = '';

const getHost = (): string => {
  if (HARDCODED_HOST) return HARDCODED_HOST;

  const manifest =
    (Constants as any)?.manifest ||
    (Constants as any)?.manifest2 ||
    (Constants as any)?.expoConfig;

  const debuggerHost =
    manifest?.debuggerHost ||
    (Constants as any)?.expoConfig?.extra?.debuggerHost;

  if (typeof debuggerHost === 'string' && debuggerHost.includes(':')) {
    return debuggerHost.split(':')[0];
  }

  const extraHost =
    manifest?.extra?.backendHost ||
    (Constants as any)?.expoConfig?.extra?.backendHost;
  if (typeof extraHost === 'string' && extraHost.trim().length > 0) {
    return extraHost.trim();
  }

  return 'localhost';
};

const HOST = getHost();

export const API_CONFIG = {
  BASE_URL: `http://${HOST}:${PORT}`,
  SOCKET_URL: `http://${HOST}:${PORT}`,
  TIMEOUT_MS: 15_000,
};
