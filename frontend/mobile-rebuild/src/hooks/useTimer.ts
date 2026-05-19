import { useEffect, useRef, useState } from 'react';

interface UseTimerArgs {
  whiteMs?: number;
  blackMs?: number;
  baseWhiteMs?: number;
  baseBlackMs?: number;
  lastServerSyncAt?: number;
  serverTimestamp?: number;
  turn: 'w' | 'b';
  activeColor?: 'w' | 'b';
  isGameOver?: boolean;
  onFlag?: (color: 'w' | 'b') => void;
}

const TICK_MS = 250;

export function useTimer({
  whiteMs,
  blackMs,
  baseWhiteMs,
  baseBlackMs,
  turn,
  activeColor,
  isGameOver = false,
  onFlag,
}: UseTimerArgs) {
  const startWhite = whiteMs ?? baseWhiteMs ?? 0;
  const startBlack = blackMs ?? baseBlackMs ?? 0;
  const tickingColor = activeColor ?? turn;

  const [displayWhiteMs, setDisplayWhiteMs] = useState(startWhite);
  const [displayBlackMs, setDisplayBlackMs] = useState(startBlack);
  const remainingRef = useRef({ white: startWhite, black: startBlack });
  const flaggedRef = useRef(false);

  useEffect(() => {
    remainingRef.current = { white: startWhite, black: startBlack };
    flaggedRef.current = false;
    setDisplayWhiteMs(startWhite);
    setDisplayBlackMs(startBlack);

    if (isGameOver) return;

    const id = setInterval(() => {
      if (tickingColor === 'w') {
        remainingRef.current.white = Math.max(0, remainingRef.current.white - TICK_MS);
      } else {
        remainingRef.current.black = Math.max(0, remainingRef.current.black - TICK_MS);
      }

      setDisplayWhiteMs(remainingRef.current.white);
      setDisplayBlackMs(remainingRef.current.black);

      if (!flaggedRef.current) {
        if (tickingColor === 'w' && remainingRef.current.white === 0) {
          flaggedRef.current = true;
          onFlag?.('w');
        } else if (tickingColor === 'b' && remainingRef.current.black === 0) {
          flaggedRef.current = true;
          onFlag?.('b');
        }
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [startWhite, startBlack, tickingColor, isGameOver, onFlag]);

  return {
    whiteMs: displayWhiteMs,
    blackMs: displayBlackMs,
  };
}
