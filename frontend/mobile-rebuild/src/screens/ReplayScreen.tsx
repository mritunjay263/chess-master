import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { Board } from '@components/Board/Board';
import { Button } from '@components/Button';
import { useGameStore } from '@store/gameStore';
import { COLORS, SPACING } from '@/constants/theme';
import { Chess } from 'chess.js';
import { piecesFromChess } from '@utils/chessHelpers';
import type { BoardPiece } from '@/types/index';

export const ReplayScreen: React.FC = () => {
  const game = useGameStore();
  const allMoves = game.moves;

  const [cursor, setCursor] = useState<number>(allMoves.length);
  const [autoplay, setAutoplay] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pieces, setPieces] = useState<BoardPiece[]>([]);
  useEffect(() => {
    const c = new Chess();
    for (let i = 0; i < cursor; i++) {
      const m = allMoves[i];
      if (!m) break;
      c.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    setPieces(piecesFromChess(c));
  }, [cursor, allMoves]);

  useEffect(() => {
    if (!autoplay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCursor((c) => (c >= allMoves.length ? (setAutoplay(false), c) : c + 1));
    }, speedMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, speedMs, allMoves.length]);

  return (
    <View style={styles.container}>
      <View style={styles.boardWrap}>
        <Board
          pieces={pieces}
          selectedSquare={null}
          legalTargets={[]}
          lastMove={cursor > 0 ? allMoves[cursor - 1] ?? null : null}
          checkSquare={null}
          flipped={game.boardFlipped}
          onSquarePress={() => {}}
          size={320}
        />
      </View>

      <Text style={styles.counter}>
        Move {cursor} / {allMoves.length}
      </Text>

      <View style={styles.controls}>
        <Button label="«" onPress={() => setCursor(0)} variant="secondary" style={{ flex: 1 }} />
        <View style={{ width: SPACING.xs }} />
        <Button label="‹" onPress={() => setCursor((c) => Math.max(0, c - 1))} variant="secondary" style={{ flex: 1 }} />
        <View style={{ width: SPACING.xs }} />
        <Button
          label="›"
          onPress={() => setCursor((c) => Math.min(allMoves.length, c + 1))}
          variant="secondary"
          style={{ flex: 1 }}
        />
        <View style={{ width: SPACING.xs }} />
        <Button label="»" onPress={() => setCursor(allMoves.length)} variant="secondary" style={{ flex: 1 }} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Autoplay</Text>
        <Switch value={autoplay} onValueChange={setAutoplay} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Speed: {(speedMs / 1000).toFixed(1)}s</Text>
        <View style={{ flexDirection: 'row' }}>
          <Button label="−" variant="ghost" onPress={() => setSpeedMs((s) => Math.min(3000, s + 200))} />
          <View style={{ width: 6 }} />
          <Button label="+" variant="ghost" onPress={() => setSpeedMs((s) => Math.max(200, s - 200))} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  boardWrap: { alignItems: 'center', marginTop: SPACING.md },
  counter: { color: COLORS.textSecondary, textAlign: 'center', marginVertical: SPACING.sm },
  controls: { flexDirection: 'row', marginVertical: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: SPACING.xs },
  label: { color: COLORS.textPrimary, fontSize: 14 },
});
