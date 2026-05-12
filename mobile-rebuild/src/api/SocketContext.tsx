// src/api/SocketContext.tsx — React context exposing the singleton socket
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from './socket';
import { useUserStore } from '@store/userStore';
import { SOCKET_ON } from '@/constants/socketEvents';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineCount: number;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineCount: 0,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);

  const socket = useMemo<Socket | null>(() => {
    if (!user) return null;
    return getSocket(token, user.id);
  }, [user, token]);

  const [connected, setConnected] = useState<boolean>(!!socket?.connected);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!socket) {
      setConnected(false);
      return;
    }

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleOnline = (data: { count: number }) => setOnlineCount(data.count);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_ON.ONLINE_COUNT, handleOnline);

    return () => {
      // BUG-2 FIX: always remove the exact listeners we attached
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_ON.ONLINE_COUNT, handleOnline);
    };
  }, [socket]);

  // Tear down socket entirely when the user logs out
  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  const value = useMemo(
    () => ({ socket, connected, onlineCount }),
    [socket, connected, onlineCount],
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
