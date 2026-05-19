// src/components/Board/ChessBoard.tsx — BUG-3: board always from chess.js
import React, { memo } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChessPiece } from '../Pieces/ChessPiece';
import { fileToLetter } from '../../utils/chessHelpers';
import type { Square } from '../../types';

const SCREEN_W = Dimensions.get('window').width;
export const TILE_SIZE = (SCREEN_W - 32) / 8;
const THEMES = {
  Classic: { light: '#F0D9B5', dark: '#B58863' },
  Green:   { light: '#FFFFDD', dark: '#86A666' },
  Blue:    { light: '#DEE3E6', dark: '#788A9B' },
};

interface Props { onSquarePress: (sq: Square) => void; interactive?: boolean; }

export const ChessBoard = memo(({ onSquarePress, interactive = true }: Props) => {
  const { selectedSquare, legalMoves, lastMove, isFlipped, _chess } = useGameStore();
  const { settings } = useSettingsStore();
  const theme = THEMES[settings.boardTheme] ?? THEMES.Classic;

  // BUG-3: always read from the chess.js instance, never from stale FEN string
  const board = _chess.board();
  const inCheck = _chess.isCheck();
  let kingSquare: Square | null = null;
  if (inCheck) {
    const t = _chess.turn();
    outer: for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p?.type === 'k' && p.color === t) { kingSquare = `${fileToLetter(c)}${8 - r}`; break outer; }
      }
  }

  const rows = isFlipped ? [...board].reverse() : board;

  return (
    <View style={styles.boardWrap}>
      <View style={styles.rankCol}>
        {rows.map((_, i) => <Text key={i} style={styles.label}>{isFlipped ? i + 1 : 8 - i}</Text>)}
      </View>
      <View>
        {rows.map((row, ri) => {
          const cols = isFlipped ? [...row].reverse() : row;
          return (
            <View key={ri} style={styles.row}>
              {cols.map((piece, ci) => {
                const file = isFlipped ? 7 - ci : ci;
                const rank = isFlipped ? ri : 7 - ri;
                const sq: Square = `${fileToLetter(file)}${rank + 1}`;
                const isLight = (file + rank) % 2 !== 0;
                const isSelected = sq === selectedSquare;
                const isLastMove = settings.showLastMove && lastMove && (sq === lastMove.from || sq === lastMove.to);
                const isKingCheck = sq === kingSquare;
                const isLegal = settings.showLegalMoves && legalMoves.includes(sq);
                const bg = isLight ? theme.light : theme.dark;
                return (
                  <TouchableOpacity
                    key={sq} activeOpacity={0.85}
                    style={[styles.tile, { backgroundColor: bg }]}
                    onPress={() => interactive && onSquarePress(sq)}
                  >
                    {isSelected && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(246,246,105,0.5)' }]}/>}
                    {isLastMove && !isSelected && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(205,209,110,0.4)' }]}/>}
                    {isKingCheck && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,0,0,0.45)' }]}/>}
                    {isLegal && !piece && <View style={styles.dot}/>}
                    {isLegal && piece && <View style={styles.captureRing}/>}
                    {piece && <ChessPiece type={piece.type} color={piece.color} size={TILE_SIZE}/>}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <View style={styles.row}>
          {Array.from({ length: 8 }).map((_, ci) => (
            <Text key={ci} style={[styles.label, { width: TILE_SIZE, textAlign: 'center' }]}>
              {fileToLetter(isFlipped ? 7 - ci : ci)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  boardWrap: { flexDirection: 'row', borderWidth: 2, borderColor: '#6B4C2A', alignSelf: 'center' },
  rankCol: { width: 16, justifyContent: 'space-around', alignItems: 'center' },
  row: { flexDirection: 'row' },
  tile: { width: TILE_SIZE, height: TILE_SIZE, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 9, color: '#8B7355', fontWeight: '600', height: TILE_SIZE / 2, lineHeight: TILE_SIZE / 2 },
  dot: { width: TILE_SIZE * 0.28, height: TILE_SIZE * 0.28, borderRadius: TILE_SIZE * 0.14, backgroundColor: 'rgba(0,0,0,0.20)' },
  captureRing: { ...StyleSheet.absoluteFillObject, borderRadius: TILE_SIZE / 2, borderWidth: TILE_SIZE * 0.07, borderColor: 'rgba(0,0,0,0.20)' },
});
