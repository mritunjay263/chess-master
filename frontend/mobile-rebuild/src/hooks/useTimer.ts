// src/hooks/useTimer.ts — local countdown that is corrected on every server sync
// BUG-5 FIX: server timestamps are the source of truth. We tick locally between
// syncs but every move_made re-sets the canonical times.
import { useEffect, useRef, useState } from 'react';
import type { Color } from '@/types/index';

interface UseTimerArgs {
  whiteMs: number;
  blackMs: number;
  /** epoch ms at which whiteMs/blackMs were captured by the server */
  lastServerSyncAt: number;
  /** whose clock is currently running */
  activeColor: Color;
  /** when true, both clocks freeze (game over, paused, modal etc.) */
  paused: boolean;
  /** invoked exactly once when active player's clock reaches 0 */
  onFlag?: (color: Color) => void;
}

export interface TimerSnapshot {
  whiteMs: number;
  blackMs: number;
  flagged: Color | null;
}

const TICK_INTERVAL_MS = 100;

export function useTimer({
  whiteMs,
  blackMs,
  lastServerSyncAt,
  activeColor,
  paused,
  onFlag,
}: UseTimerArgs): TimerSnapshot {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>({
    whiteMs,
    blackMs,
    flagged: null,
  });
  const flagFiredRef = useRef(false);

  useEffect(() => {
    // Re-baseline on every server sync — reset the "flag fired" guard too
    flagFiredRef.current = false;
    setSnapshot({ whiteMs, blackMs, flagged: null });
  }, [whiteMs, blackMs, lastServerSyncAt, activeColor]);

  useEffect(() => {
    if (paused) return;
    const baseSyncAt = lastServerSyncAt || Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - baseSyncAt;
      const nextWhite = activeColor === 'w' ? Math.max(0, whiteMs - elapsed) : whiteMs;
      const nextBlack = activeColor === 'b' ? Math.max(0, blackMs - elapsed) : blackMs;
      const flagged =
        nextWhite === 0 ? 'w' : nextBlack === 0 ? 'b' : null;
      setSnapshot({ whiteMs: nextWhite, blackMs: nextBlack, flagged });
      if (flagged && !flagFiredRef.current) {
        flagFiredRef.current = true;
        onFlag?.(flagged);
      }
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [whiteMs, blackMs, lastServerSyncAt, activeColor, paused, onFlag]);

  return snapshot;
}
