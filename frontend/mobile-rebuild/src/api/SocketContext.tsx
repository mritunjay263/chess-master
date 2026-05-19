// src/api/SocketContext.tsx — React context exposing the singleton socket
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  socket: null, connected: false, onlineCount: 0,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user  = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);

  const socket = useMemo<Socket | null>(() => {
    if (!user) return null;
    return getSocket(token, user.id);
  }, [user?.id, token]);

  const [connected,   setConnected]   = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!socket) { setConnected(false); return; }

    setConnected(socket.connected);

    const onConnect    = () => setConnected(true);
    const onDisconnect = (reason: string) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 2000);
      }
    };
    const onError      = () => setConnected(false);
    const onReconnect  = () => setConnected(true);
    const onOnline     = (d: { count: number }) => setOnlineCount(d.count);

    socket.on('connect',              onConnect);
    socket.on('disconnect',           onDisconnect);
    socket.on('connect_error',        onError);
    socket.io.on('reconnect',         onReconnect);
    socket.on(SOCKET_ON.ONLINE_COUNT, onOnline);

    return () => {
      socket.off('connect',              onConnect);
      socket.off('disconnect',           onDisconnect);
      socket.off('connect_error',        onError);
      socket.io.off('reconnect',         onReconnect);
      socket.off(SOCKET_ON.ONLINE_COUNT, onOnline);
    };
  }, [socket]);

  useEffect(() => { if (!user) disconnectSocket(); }, [user]);

  const value = useMemo(() => ({ socket, connected, onlineCount }), [socket, connected, onlineCount]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
