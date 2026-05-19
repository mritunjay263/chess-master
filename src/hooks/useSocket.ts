// src/hooks/useSocket.ts — BUG-2: singleton provider, all listeners cleaned on unmount
import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '../api/socket';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import type {
  MatchFoundPayload, MoveMadePayload, GameOverPayload,
  DrawOfferedPayload, OpponentLeftPayload, ErrorPayload
} from '../types';

interface Ctx { socket: Socket|null; emit:(e:string,d?:any)=>void; }
const SocketContext = createContext<Ctx>({ socket:null, emit:()=>{} });

export function SocketProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Socket|null>(null);
  const { user } = useUserStore();
  const { applyMove, setResult, setDrawOffered, setRematchOffered, resetGame, startGame } = useGameStore();

  useEffect(() => {
    if (!user) return;
    const s = connectSocket(user.token);
    ref.current = s;

    const onMatchFound = (d: MatchFoundPayload) => {
      startGame({
        matchId: d.matchId, white: d.white, black: d.black,
        timeControl: d.timeControl,
        myColor: d.white.id === user.id ? 'w' : 'b',
      });
    };

    // BUG-5: server times are source of truth
    const onMoveMade = (d: MoveMadePayload) => {
      applyMove({
        from: d.move.from, to: d.move.to, promotion: d.move.promotion,
        fen: d.fen, times: d.times, san: d.move.san,
        captured: d.move.captured as any,
      });
    };

    const onGameOver = (d: GameOverPayload) => setResult(d.result);
    const onDrawOffered = (d: DrawOfferedPayload) => setDrawOffered(d.by);
    const onDrawDeclined = () => setDrawOffered(null);
    // BUG-6: rematch_ready triggers full state reset
    const onRematchOffered = () => setRematchOffered(true);
    const onRematchReady = () => resetGame();
    const onOpponentLeft = () => setResult({ winner: null, reason: 'opponent_left' });
    const onError = (d: ErrorPayload) => console.warn('[Socket]', d.code, d.message);

    // Reconnect: rejoin active game
    const onConnect = () => {
      const { matchId } = useGameStore.getState();
      if (matchId) s.emit('rejoin_game', { matchId, playerId: user.id });
    };

    s.on('match_found', onMatchFound);
    s.on('move_made', onMoveMade);
    s.on('game_over', onGameOver);
    s.on('draw_offered', onDrawOffered);
    s.on('draw_declined', onDrawDeclined);
    s.on('rematch_offered', onRematchOffered);
    s.on('rematch_ready', onRematchReady);
    s.on('opponent_left', onOpponentLeft);
    s.on('error', onError);
    s.on('connect', onConnect);

    // BUG-2: remove ALL listeners on cleanup
    return () => {
      s.off('match_found', onMatchFound);
      s.off('move_made', onMoveMade);
      s.off('game_over', onGameOver);
      s.off('draw_offered', onDrawOffered);
      s.off('draw_declined', onDrawDeclined);
      s.off('rematch_offered', onRematchOffered);
      s.off('rematch_ready', onRematchReady);
      s.off('opponent_left', onOpponentLeft);
      s.off('error', onError);
      s.off('connect', onConnect);
      disconnectSocket();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket: ref.current, emit: (e, d) => ref.current?.emit(e, d) }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
