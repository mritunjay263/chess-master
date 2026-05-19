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

// Midnight royal palette
export const COLORS = {
  background: '#011230',
  surface: '#011230',
  surfaceAlt: '#091b39',
  surfaceContainer: '#0e1f3d',
  surfaceContainerLow: '#091b39',
  surfaceContainerHigh: '#192a48',
  surfaceVariant: '#253453',
  primary: '#b9c7e4',
  primaryDark: '#74829d',
  onPrimary: '#233148',
  secondary: '#95d3ba',
  secondaryFixedDim: '#95d3ba',
  onSecondary: '#003829',
  onSecondaryFixed: '#002117',
  accent: '#c1c7cf',
  danger: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',
  onPrimaryContainer: '#74829d',
  onSecondaryContainer: '#83c2a9',
  secondaryContainer: '#0b513d',
  surfaceBright: '#293958',
  surfaceContainerLowest: '#000d27',
  textPrimary: '#d8e2ff',
  textSecondary: '#c5c6cd',
  textMuted: '#8f9097',
  border: '#44474d',
  outline: '#8f9097',
  outlineVariant: '#44474d',
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
