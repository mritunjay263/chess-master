// src/components/CapturedRow/CapturedRow.tsx
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ChessPiece } from '../Pieces/ChessPiece';
import type { ChessMove, PieceColor, PieceType } from '../../types';

interface Props { moves: ChessMove[]; capturedBy: PieceColor; }

export const CapturedRow = memo(({ moves, capturedBy }: Props) => {
  const capturedPieces = moves
    .filter(m => m.captured)
    .map(m => m.captured!)
    .filter((_, i, arr) => arr.indexOf(arr[i]) === i ? true : true);
  const capturedColor: PieceColor = capturedBy === 'w' ? 'b' : 'w';
  return (
    <View style={styles.row}>
      {capturedPieces.map((p, i) => (
        <View key={i} style={styles.wrap}>
          <ChessPiece type={p as PieceType} color={capturedColor} size={20}/>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection:'row', flexWrap:'wrap', minHeight:24 },
  wrap: { marginRight:-6 },
});
