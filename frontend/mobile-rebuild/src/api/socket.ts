// src/api/socket.ts — singleton Socket.IO client (fixes BUG-2: no duplicate sockets)
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './config';

let socket: Socket | null = null;

/**
 * Returns the singleton socket. Creates it lazily on first call.
 * Auth is attached lazily so we can refresh tokens.
 */
export function getSocket(authToken?: string | null, userId?: string | null): Socket {
  if (socket && socket.connected) return socket;
  if (socket) {
    // Already created but not connected — update auth and reconnect.
    socket.auth = { token: authToken ?? undefined, userId: userId ?? undefined };
    if (!socket.active) socket.connect();
    return socket;
  }
  socket = io(API_CONFIG.SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: { token: authToken ?? undefined, userId: userId ?? undefined },
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return !!socket?.connected;
}
