// src/api/socket.ts — BUG-2: singleton, created once, cleaned on disconnect
import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
let socketInstance: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (socketInstance) return socketInstance;
  socketInstance = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    auth: token ? { token } : undefined,
  });
  socketInstance.on('connect_error', e => console.warn('[Socket] error', e.message));
  socketInstance.on('connect', () => console.log('[Socket] connected'));
  socketInstance.on('disconnect', r => console.log('[Socket] disconnected', r));
  return socketInstance;
}

export function connectSocket(token?: string): Socket {
  const s = getSocket(token);
  if (!s.connected && !s.active) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socketInstance?.disconnect();
  socketInstance = null;
}
