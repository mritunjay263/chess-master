// src/constants/theme.ts — visual tokens (colors, board themes, piece themes)
import type { BoardThemeKey, PieceThemeKey } from '@/types/index';

export interface BoardTheme {
  light: string;
  dark: string;
  border: string;
  selected: string; // semi-transparent overlay
  legalDot: string;
  lastMove: string;
  check: string;
  coordinate: string;
}

export const BOARD_THEMES: Record<BoardThemeKey, BoardTheme> = {
  classic: {
    light: '#F0D9B5',
    dark: '#B58863',
    border: '#6B4C2A',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#8A7B6A',
  },
  green: {
    light: '#EEEED2',
    dark: '#769656',
    border: '#3D5A2C',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#5C6B4E',
  },
  blue: {
    light: '#DEE3E6',
    dark: '#788FA1',
    border: '#3E5363',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#4F6373',
  },
};

export const PIECE_THEMES: Record<PieceThemeKey, { displayName: string }> = {
  merida: { displayName: 'Merida' },
  alpha: { displayName: 'Alpha' },
  neo: { displayName: 'Neo' },
};

export const COLORS = {
  background: '#0F1418',
  surface: '#1A2026',
  surfaceAlt: '#242C33',
  primary: '#7FA650',
  primaryDark: '#5C7D38',
  accent: '#E8A53D',
  danger: '#E04B4B',
  textPrimary: '#F5F1E8',
  textSecondary: '#A8B0B8',
  textMuted: '#6B7480',
  border: '#2A333B',
  timerGreen: '#7FA650',
  timerAmber: '#E8A53D',
  timerRed: '#E04B4B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  mono: { fontSize: 14, fontFamily: 'Menlo' },
};
