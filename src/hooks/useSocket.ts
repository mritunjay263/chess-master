// src/hooks/useSocket.ts
// FIX: event names now match backend socketEvents.ts exactly
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getSocket, disconnectSocket } from '../services/socketService';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import type { ChessMove, GameResult, PieceColor } from '../types';

export type ConnStatus = 'connecting' | 'connected' | 'disconnected';

export function useSocket() {
  const { user, token } = useUserStore();
  const {
    setMatch, applyMove, setStatus,
    setWhiteTime, setBlackTime,
    setRematchOffered, setDrawOffered, setAlert,
  } = useGameStore();
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting');
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;
    const s = getSocket();

    const onConnect    = () => setConnStatus('connected');
    const onDisconnect = () => setConnStatus('disconnected');
    const onConnErr    = () => setConnStatus('disconnected');

    // FIX: backend emits 'match_found' with { matchId, color, white, black, timeMs }
    const onMatchFound = (d: { matchId: string; color: PieceColor; white: any; black: any; timeMs: number }) => {
      setMatch(d.matchId, d.color, d.white, d.black, d.timeMs);
    };

    // FIX: backend emits move_made as a flat ChessMove object
    const onMoveMade = (move: ChessMove) => applyMove(move);

    // FIX: backend emits timer_sync as { white, black } (ms)
    const onTimerSync = (d: { white: number; black: number }) => {
      setWhiteTime(d.white);
      setBlackTime(d.black);
    };

    // FIX: backend emits game_over as { result: { winner, reason } }
    const onGameOver = (d: { result: GameResult }) => setStatus('finished', d.result);

    const onRematch            = () => setRematchOffered(true);
    const onDrawOffer          = (d: { from: PieceColor }) => setDrawOffered(d.from);
    const onDrawAccepted       = () => setStatus('finished', { winner: 'draw', reason: 'agreement' });
    const onOpponentDisconnect = () => setAlert('Opponent disconnected');
    const onOpponentReconnect  = () => setAlert(null);

    s.on('connect',              onConnect);
    s.on('disconnect',           onDisconnect);
    s.on('connect_error',        onConnErr);
    s.on('match_found',          onMatchFound);
    s.on('move_made',            onMoveMade);
    s.on('timer_sync',           onTimerSync);
    s.on('game_over',            onGameOver);
    s.on('rematch_offered',      onRematch);
    s.on('draw_offered',         onDrawOffer);
    s.on('draw_accepted',        onDrawAccepted);
    s.on('opponent_disconnected',onOpponentDisconnect);
    s.on('opponent_reconnected', onOpponentReconnect);

    if (s.connected) setConnStatus('connected');

    const appSub = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        if (!s.connected) s.connect();
      }
      appStateRef.current = next;
    });

    return () => {
      s.off('connect',              onConnect);
      s.off('disconnect',           onDisconnect);
      s.off('connect_error',        onConnErr);
      s.off('match_found',          onMatchFound);
      s.off('move_made',            onMoveMade);
      s.off('timer_sync',           onTimerSync);
      s.off('game_over',            onGameOver);
      s.off('rematch_offered',      onRematch);
      s.off('draw_offered',         onDrawOffer);
      s.off('draw_accepted',        onDrawAccepted);
      s.off('opponent_disconnected',onOpponentDisconnect);
      s.off('opponent_reconnected', onOpponentReconnect);
      appSub.remove();
    };
  }, [user?.id]);

  const emit = (event: string, data?: any) => {
    const s = getSocket();
    if (s.connected) s.emit(event, data);
    else console.warn('[socket] not connected, dropping:', event);
  };

  return { connStatus, emit };
}
