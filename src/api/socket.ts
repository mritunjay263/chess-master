// src/api/socket.ts
// ─── CRITICAL FIX: Expo Tunnel compatibility ───────────────────────────────
// Expo tunnel proxies via HTTPS. Socket.IO's WebSocket-only mode FAILS on tunnel
// because the tunnel proxy blocks the WS upgrade handshake.
// FIX: always try polling first, then upgrade to websocket.
// This is the standard Socket.IO behaviour and works on:
//   • Expo tunnel  (https://xxxx.exp.direct)
//   • LAN IP       (http://192.168.x.x:3001)
//   • Android emu  (http://10.0.2.2:3001)
//   • iOS sim      (http://localhost:3001)
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let _socket: Socket | null = null;

export function getSocket(token?: string, userId?: string): Socket {
  if (_socket) return _socket;

  console.log('[Socket] creating instance →', SOCKET_URL);

  _socket = io(SOCKET_URL, {
    // CRITICAL: do NOT use ['websocket'] only — polling must be first
    // so the tunnel proxy handshake succeeds before upgrading
    transports: ['polling', 'websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
    timeout: 20000,
    forceNew: false,
    auth: {
      token: token ?? undefined,
      userId: userId ?? undefined,
    },
  });

  _socket.on('connect', () =>
    console.log('[Socket] ✅ connected  id:', _socket?.id, ' url:', SOCKET_URL),
  );
  _socket.on('disconnect', reason =>
    console.log('[Socket] ❌ disconnected:', reason),
  );
  _socket.on('connect_error', err =>
    console.warn('[Socket] connect_error:', err.message, '\n  → URL:', SOCKET_URL,
      '\n  → Make sure EXPO_PUBLIC_API_URL is set to your tunnel URL in .env'),
  );

  return _socket;
}

export function connectSocket(token?: string, userId?: string): Socket {
  // Tear down if auth changed
  if (_socket && ((_socket.auth as any)?.token ?? null) !== (token ?? null)) {
    console.log('[Socket] auth changed — recreating socket');
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
  const s = getSocket(token, userId);
  if (!s.connected && !s.active) {
    console.log('[Socket] calling .connect()');
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
    console.log('[Socket] disconnected and destroyed');
  }
}
