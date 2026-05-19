// src/services/socketService.ts — BUG-2: single socket singleton, cleanup on disconnect
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../api/config';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
