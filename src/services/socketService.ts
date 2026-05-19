// src/services/socketService.ts
// FIX: auth is passed in handshake so backend middleware can identify user/guest
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../api/config';
import { useUserStore } from '../store/userStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  const { user, token } = useUserStore.getState();

  if (!socket || !socket.connected) {
    if (socket) { socket.removeAllListeners(); socket.disconnect(); }
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 6,
      reconnectionDelay: 2000,
      // FIX: backend auth middleware reads these
      auth: {
        userId: user?.id ?? '',
        token: token ?? undefined,
      },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.removeAllListeners(); socket.disconnect(); socket = null; }
}
