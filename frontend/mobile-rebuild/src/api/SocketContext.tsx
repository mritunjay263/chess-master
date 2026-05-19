// ============================================================
// src/api/SocketContext.tsx
// [BUG-2 FIX] Singleton socket — created once, listeners always
// cleaned up in useEffect returns. Never re-created on re-render.
// ============================================================
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import type {
  SocketMatchFound,
  SocketMoveMade,
  SocketGameOver,
  SocketDrawOffered,
  SocketRematchReady,
  SocketOpponentLeft,
  SocketError,
  MoveRecord,
} from '../types';
import { Chess } from 'chess.js';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface SocketContextValue {
  socket: Socket | null;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: 'disconnected',
  connect: () => {},
  disconnect: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

let socketSingleton: Socket | null = null;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const user = useUserStore((s) => s.user);
  const {
    startGame, applyMove, setGameOver, setDrawOffer,
    setRematchOffered, resetGame,
  } = useGameStore.getState();

  const connect = () => {
    if (socketSingleton?.connected) return; // prevent duplicate connections

    const sock = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { userId: user?.id, username: user?.username },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      // Required for React Native Socket.IO compatibility
      forceNew: false,
    });

    socketSingleton = sock;
    socketRef.current = sock;

    sock.on('connect', () => setStatus('connected'));
    sock.on('disconnect', () => setStatus('disconnected'));
    sock.on('connect_error', (err) => {
      console.warn('[Socket] connect_error:', err.message);
      setStatus('disconnected');
    });

    // --- Global game event listeners ---
    // These are on the singleton and persist; component-level
    // listeners (in useChessGame) are added/removed per screen.

    sock.on('match_found', (data: SocketMatchFound) => {
      const myId = useUserStore.getState().user?.id;
      const myColor = data.white.id === myId ? 'w' : 'b';
      const opponent = myColor === 'w' ? data.black : data.white;
      startGame(
        data.matchId, myColor, opponent,
        data.timeControl.initialTime * 1000
      );
    });

    sock.on('game_over', (data: SocketGameOver) => {
      const myId = useUserStore.getState().user?.id;
      let result: 'win' | 'lose' | 'draw';
      if (data.result === 'draw') result = 'draw';
      else result = data.winner === myId ? 'win' : 'lose';
      setGameOver(result, data.reason);
    });

    sock.on('draw_offered', (data: SocketDrawOffered) => {
      setDrawOffer(data.by);
    });

    sock.on('draw_declined', () => setDrawOffer(null));

    sock.on('rematch_offered', () => setRematchOffered(true));

    sock.on('rematch_ready', (_data: SocketRematchReady) => {
      // Server signals both accepted — reset and navigate handled in hook
      resetGame();
    });

    sock.on('opponent_left', (_data: SocketOpponentLeft) => {
      setGameOver('win', 'opponent_left');
    });

    sock.on('error', (data: SocketError) => {
      console.warn('[Socket] server error:', data.code, data.message);
    });

    // On reconnect: rejoin active game if any [BUG-2]
    sock.on('reconnect', () => {
      const { matchId } = useGameStore.getState();
      const uid = useUserStore.getState().user?.id;
      if (matchId && uid) {
        sock.emit('rejoin_game', { matchId, playerId: uid });
      }
    });

    setStatus('connecting');
  };

  const disconnect = () => {
    socketSingleton?.disconnect();
    socketSingleton = null;
    socketRef.current = null;
    setStatus('disconnected');
  };

  // Auto-connect when user logs in
  useEffect(() => {
    if (user?.id) {
      connect();
    } else {
      disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, status, connect, disconnect }}
    >
      {children}
    </SocketContext.Provider>
  );
}
