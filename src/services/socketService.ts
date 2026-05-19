// src/services/socketService.ts
// Thin wrapper — delegates to src/api/socket.ts singleton.
// Reads auth from Zustand store via .getState() (NOT as a hook — safe outside React).
import {
  getSocket as _get,
  connectSocket as _connect,
  disconnectSocket as _disconnect,
} from '../api/socket';
import type { Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';

export function getSocket(): Socket {
  const { user, token } = useUserStore.getState();
  return _get(token ?? undefined, user?.id ?? undefined);
}

export function connectSocket(): Socket {
  const { user, token } = useUserStore.getState();
  return _connect(token ?? undefined, user?.id ?? undefined);
}

export function disconnectSocket(): void {
  _disconnect();
}
