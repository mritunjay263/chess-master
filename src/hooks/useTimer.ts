// src/hooks/useTimer.ts — BUG-5: tick only when game is active and it is that color's turn
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { PieceColor } from '../types';

export function useTimer(myColor: PieceColor) {
  const { status, turn, whiteTime, blackTime, setWhiteTime, setBlackTime } = useGameStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'active') {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }

    tickRef.current = setInterval(() => {
      const s = useGameStore.getState();
      if (s.status !== 'active') return;
      if (s.turn === 'w') s.setWhiteTime(Math.max(0, s.whiteTime - 100));
      else s.setBlackTime(Math.max(0, s.blackTime - 100));
    }, 100);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [status, turn]);

  return { whiteTime, blackTime };
}
