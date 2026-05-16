import Constants from 'expo-constants';

const PORT = 3000;

const getHost = (): string => {
  const debuggerHost =
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.expoConfig?.extra?.debuggerHost ||
    (Constants as any)?.manifest2?.debuggerHost;

  if (typeof debuggerHost === 'string' && debuggerHost.includes(':')) {
    return debuggerHost.split(':')[0];
  }

  const extraHost = (Constants as any)?.expoConfig?.extra?.backendHost;
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
