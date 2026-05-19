// src/api/socket.ts
// SINGLE socket singleton used by the entire app.
// FIX: reads URL from EXPO_PUBLIC_API_URL (works with Expo tunnel).
// FIX: passes auth.token + auth.userId so backend middleware identifies the user.
// FIX: autoConnect is FALSE — call connectSocket() explicitly after login.
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let _socket: Socket | null = null;

/**
 * Returns the singleton Socket.IO instance.
 * Creates it lazily on first call.
 * @param token  JWT token (required for authenticated users)
 * @param userId userId string (for guest fallback)
 */
export function getSocket(token?: string, userId?: string): Socket {
  if (_socket) return _socket;

  _socket = io(SOCKET_URL, {
    transports: ['websocket'],   // websocket only — polling fails on tunnel
    autoConnect: false,          // explicit connect after auth
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 15000,
    auth: {
      token:  token  ?? undefined,
      userId: userId ?? undefined,
    },
  });

  _socket.on('connect',       () => console.log('[Socket] connected to', SOCKET_URL));
  _socket.on('disconnect',    (r) => console.log('[Socket] disconnected:', r));
  _socket.on('connect_error', (e) => console.warn('[Socket] connect_error:', e.message, '| URL:', SOCKET_URL));

  return _socket;
}

/**
 * Call this after the user logs in / enters as guest.
 * Re-creates the socket if auth changed (e.g. user switched accounts).
 */
export function connectSocket(token?: string, userId?: string): Socket {
  // If auth changed, tear down old socket and create fresh one
  if (_socket && (_socket.auth as any)?.token !== token) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
  const s = getSocket(token, userId);
  if (!s.connected && !s.active) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}
