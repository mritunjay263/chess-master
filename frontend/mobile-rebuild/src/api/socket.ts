// src/api/socket.ts — singleton Socket.IO client
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './config';

let socket: Socket | null = null;

export function getSocket(authToken?: string | null, userId?: string | null): Socket {
  if (socket) {
    socket.auth = { token: authToken ?? undefined, userId: userId ?? undefined };
    if (!socket.connected && !socket.active) socket.connect();
    return socket;
  }
  socket = io(API_CONFIG.SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 15000,
    auth: { token: authToken ?? undefined, userId: userId ?? undefined },
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err.message);
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
