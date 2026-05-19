// src/utils/chessHelpers.ts
export const fileToLetter = (f: number): string =>
  ['a','b','c','d','e','f','g','h'][f] ?? 'a';

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
