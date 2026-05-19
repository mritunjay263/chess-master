// src/hooks/useSocket.ts — BUG-2: listeners cleaned up in useEffect return
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
    setMatch, applyMove, setStatus, setWhiteTime, setBlackTime,
    setRematchOffered, setDrawOffered, setAlert,
  } = useGameStore();
  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting');
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;
    const s = getSocket();

    // Auth
    s.emit('authenticate', { userId: user.id, token });

    // Connection events
    const onConnect = () => setConnStatus('connected');
    const onDisconnect = () => setConnStatus('disconnected');
    const onConnErr = () => setConnStatus('disconnected');

    // Game events — BUG-2: all registered here, removed on cleanup
    const onMatchFound = (d: { matchId: string; color: PieceColor; white: any; black: any; timeMs: number }) => {
      setMatch(d.matchId, d.color, d.white, d.black, d.timeMs);
    };
    const onMoveMade = (move: ChessMove) => applyMove(move);
    const onTimerSync = (d: { white: number; black: number }) => {
      setWhiteTime(d.white); setBlackTime(d.black);
    };
    const onGameOver = (d: { result: GameResult }) => setStatus('finished', d.result);
    const onRematch = () => setRematchOffered(true);
    const onDrawOffer = (d: { from: PieceColor }) => setDrawOffered(d.from);
    const onDrawAccepted = () => setStatus('finished', { winner: 'draw', reason: 'agreement' });
    const onOpponentDisconnect = () => setAlert('Opponent disconnected');
    const onOpponentReconnect = () => setAlert(null);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnErr);
    s.on('match_found', onMatchFound);
    s.on('move_made', onMoveMade);
    s.on('timer_sync', onTimerSync);
    s.on('game_over', onGameOver);
    s.on('rematch_offered', onRematch);
    s.on('draw_offered', onDrawOffer);
    s.on('draw_accepted', onDrawAccepted);
    s.on('opponent_disconnected', onOpponentDisconnect);
    s.on('opponent_reconnected', onOpponentReconnect);

    if (s.connected) setConnStatus('connected');

    // App background/foreground reconnect
    const appStateSub = AppState.addEventListener('change', next => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        if (!s.connected) s.connect();
      }
      appStateRef.current = next;
    });

    return () => {
      // BUG-2: remove ALL listeners on unmount, never accumulate duplicates
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnErr);
      s.off('match_found', onMatchFound);
      s.off('move_made', onMoveMade);
      s.off('timer_sync', onTimerSync);
      s.off('game_over', onGameOver);
      s.off('rematch_offered', onRematch);
      s.off('draw_offered', onDrawOffer);
      s.off('draw_accepted', onDrawAccepted);
      s.off('opponent_disconnected', onOpponentDisconnect);
      s.off('opponent_reconnected', onOpponentReconnect);
      appStateSub.remove();
    };
  }, [user?.id]);

  const emit = (event: string, data?: any) => {
    const s = getSocket();
    if (s.connected) s.emit(event, data);
    else console.warn('[socket] Not connected, dropping:', event);
  };

  return { connStatus, emit };
}
