// src/hooks/useSocket.ts — thin accessor + emit helper
import { useCallback } from 'react';
import { useSocketContext } from '@api/SocketContext';

export function useSocket() {
  const { socket, connected, onlineCount } = useSocketContext();

  const emit = useCallback(
    <T,>(event: string, payload?: T) => {
      if (!socket) return false;
      socket.emit(event, payload);
      return true;
    },
    [socket],
  );

  return { socket, connected, onlineCount, emit };
}
