// src/services/socketService.ts
// FIX: delegates entirely to src/api/socket.ts — no duplicate singleton.
// FIX: reads token/userId without calling useUserStore inside module scope
//      (calling a hook outside React caused runtime crashes).
import { getSocket as _get, connectSocket as _connect, disconnectSocket as _disconnect } from '../api/socket';
import type { Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';

/** Returns the singleton, creating it with current auth if needed. */
export function getSocket(): Socket {
  const { user, token } = useUserStore.getState();
  return _get(token ?? undefined, user?.id ?? undefined);
}

/** Call after login. Reconnects with fresh auth if token changed. */
export function connectSocket(): Socket {
  const { user, token } = useUserStore.getState();
  return _connect(token ?? undefined, user?.id ?? undefined);
}

export function disconnectSocket(): void {
  _disconnect();
}
