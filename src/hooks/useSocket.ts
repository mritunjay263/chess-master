// src/hooks/useSocket.ts
// FIX: connects socket on mount, properly cleans up, event names match backend.
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../utils/soundManager';
import { triggerHaptic } from '../utils/hapticManager';
import type { ChessMove, GameResult, PieceColor } from '../types';

export type ConnStatus = 'connecting' | 'connected' | 'disconnected';

export function useSocket() {
  const { user } = useUserStore();
  const {
    setMatch, applyMove, setStatus,
    setWhiteTime, setBlackTime,
    setRematchOffered, setDrawOffered, setAlert,
  } = useGameStore();

  const [connStatus, setConnStatus] = useState<ConnStatus>('connecting');
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    // FIX: connectSocket() — actually initiates the WebSocket handshake
    const s = connectSocket();

    const onConnect    = () => { setConnStatus('connected'); console.log('[useSocket] connected'); };
    const onDisconnect = () => { setConnStatus('disconnected'); };
    const onConnErr    = (e: Error) => {
      setConnStatus('disconnected');
      console.warn('[useSocket] connect_error:', e.message);
    };

    const onMatchFound = (d: { matchId: string; color: PieceColor; white: any; black: any; timeMs: number }) => {
      playSound('game_start');
      triggerHaptic('notificationSuccess');
      setMatch(d.matchId, d.color, d.white, d.black, d.timeMs);
    };

    const onMoveMade = (move: ChessMove) => {
      // Play different sound for own vs opponent move — applyMove sets whose turn it was
      const { myColor } = useGameStore.getState();
      const isMyMove = move.piece === myColor;
      playSound(move.captured ? 'capture' : isMyMove ? 'move_self' : 'move_opponent');
      triggerHaptic(move.captured ? 'impactMedium' : 'impactLight');
      applyMove(move);
    };

    const onTimerSync = (d: { white: number; black: number }) => {
      setWhiteTime(d.white);
      setBlackTime(d.black);
    };

    const onGameOver = (d: { result: GameResult }) => {
      const { myColor } = useGameStore.getState();
      const won = d.result.winner === myColor;
      playSound(d.result.winner === 'draw' ? 'draw' : won ? 'game_end_win' : 'game_end_lose');
      triggerHaptic(won ? 'notificationSuccess' : 'notificationError');
      setStatus('finished', d.result);
    };

    const onCheck = () => {
      playSound('check');
      triggerHaptic('notificationWarning');
    };

    const onRematch            = () => { playSound('notify'); setRematchOffered(true); };
    const onDrawOffer          = (d: { from: PieceColor }) => { playSound('notify'); setDrawOffered(d.from); };
    const onDrawAccepted       = () => setStatus('finished', { winner: 'draw', reason: 'agreement' });
    const onOpponentDisconnect = () => { triggerHaptic('notificationWarning'); setAlert('Opponent disconnected'); };
    const onOpponentReconnect  = () => setAlert(null);

    s.on('connect',               onConnect);
    s.on('disconnect',            onDisconnect);
    s.on('connect_error',         onConnErr);
    s.on('match_found',           onMatchFound);
    s.on('move_made',             onMoveMade);
    s.on('timer_sync',            onTimerSync);
    s.on('game_over',             onGameOver);
    s.on('check',                 onCheck);
    s.on('rematch_offered',       onRematch);
    s.on('draw_offered',          onDrawOffer);
    s.on('draw_accepted',         onDrawAccepted);
    s.on('opponent_disconnected', onOpponentDisconnect);
    s.on('opponent_reconnected',  onOpponentReconnect);

    if (s.connected) setConnStatus('connected');

    const appSub = AppState.addEventListener('change', next => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if ((prev === 'inactive' || prev === 'background') && next === 'active') {
        if (!s.connected) s.connect();
      }
    });

    return () => {
      s.off('connect',               onConnect);
      s.off('disconnect',            onDisconnect);
      s.off('connect_error',         onConnErr);
      s.off('match_found',           onMatchFound);
      s.off('move_made',             onMoveMade);
      s.off('timer_sync',            onTimerSync);
      s.off('game_over',             onGameOver);
      s.off('check',                 onCheck);
      s.off('rematch_offered',       onRematch);
      s.off('draw_offered',          onDrawOffer);
      s.off('draw_accepted',         onDrawAccepted);
      s.off('opponent_disconnected', onOpponentDisconnect);
      s.off('opponent_reconnected',  onOpponentReconnect);
      appSub.remove();
    };
  }, [user?.id]);

  const emit = useCallback((event: string, data?: any) => {
    const s = getSocket();
    if (s.connected) {
      s.emit(event, data);
    } else {
      console.warn('[useSocket] not connected, dropping:', event);
    }
  }, []);

  return { connStatus, emit };
}
