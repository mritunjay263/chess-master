// src/hooks/useTimer.ts — BUG-5: server timestamps are source of truth
import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { useSocket } from './useSocket';
import { triggerHaptic } from '../utils/hapticManager';
import { playSound } from '../utils/soundManager';
import type { PieceColor } from '../types';

export function useTimer(myColor: PieceColor) {
  const { whiteTime, blackTime, turn, status, matchId, timeControl } = useGameStore();
  const { emit } = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const lastTickRef = useRef(-1);
  const initialMs = (timeControl?.initial ?? 600) * 1000;

  const whiteProgress = useSharedValue(whiteTime / initialMs);
  const blackProgress = useSharedValue(blackTime / initialMs);

  // Sync animated arc progress whenever server updates times
  useEffect(() => {
    whiteProgress.value = withTiming(Math.max(0, whiteTime / initialMs), { duration: 350, easing: Easing.out(Easing.quad) });
    blackProgress.value = withTiming(Math.max(0, blackTime / initialMs), { duration: 350, easing: Easing.out(Easing.quad) });
  }, [whiteTime, blackTime]);

  // Local countdown (UI only) — overridden by server on every move
  useEffect(() => {
    if (status !== 'playing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const side = turn;
    intervalRef.current = setInterval(() => {
      const st = useGameStore.getState();
      const cur = side === 'w' ? st.whiteTime : st.blackTime;
      const next = Math.max(0, cur - 1000);
      side === 'w'
        ? useGameStore.setState({ whiteTime: next })
        : useGameStore.setState({ blackTime: next });
      const secs = Math.floor(next / 1000);
      if (secs < 10 && secs !== lastTickRef.current && side === myColor) {
        lastTickRef.current = secs;
        playSound('tick'); triggerHaptic('selection');
      }
      if (next <= 0 && matchId) {
        clearInterval(intervalRef.current!);
        emit('resign', { matchId, reason: 'timeout' });
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [turn, status, matchId]);

  const getColor = useCallback((ms: number): 'green'|'amber'|'red' =>
    ms > 30000 ? 'green' : ms > 10000 ? 'amber' : 'red', []);

  return { whiteTime, blackTime, whiteProgress, blackProgress, getColor, isMyTurn: turn === myColor };
}
