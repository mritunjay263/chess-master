// src/utils/chessHelpers.ts
import { Chess } from 'chess.js';
import type { PieceType } from '../types';

const VALS: Record<PieceType, number> = { p:1, n:3, b:3, r:5, q:9, k:0 };

export function materialAdvantage(fen: string): number {
  const chess = new Chess(fen);
  let score = 0;
  for (const row of chess.board())
    for (const p of row)
      if (p) score += p.color === 'w' ? VALS[p.type] : -VALS[p.type];
  return score;
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export function fileToLetter(f: number): string { return String.fromCharCode(97 + f); }
export function rankToLabel(r: number): string { return String(8 - r); }
