// src/constants/theme.ts — black & white mobile chess theme
export const COLORS = {
  background:   '#0a0a0a',
  surface:      '#111111',
  surfaceAlt:   '#181818',
  surfaceContainer: '#1e1e1e',
  border:       '#2a2a2a',
  borderStrong: '#3a3a3a',
  primary:      '#ffffff',
  primaryMuted: '#cccccc',
  textPrimary:  '#ffffff',
  textSecondary:'#999999',
  textFaint:    '#555555',
  accent:       '#ffffff',
  danger:       '#ff4444',
  success:      '#44ff88',
  outlineVariant: '#444444',
  outline:      '#555555',
  onPrimary:    '#000000',
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 16, xl: 24, full: 9999,
};

export interface BoardTheme {
  light: string; dark: string; border: string;
  selected: string; legalDot: string; lastMove: string;
  check: string; coordinate: string;
}

export const BOARD_THEMES: Record<string, BoardTheme> = {
  classic: {
    light: '#f0d9b5', dark: '#b58863', border: '#6b4c2a',
    selected: 'rgba(246,246,105,0.5)', legalDot: 'rgba(0,0,0,0.25)',
    lastMove: 'rgba(205,209,110,0.45)', check: 'rgba(255,0,0,0.45)',
    coordinate: '#8a7b6a',
  },
  bw: {
    light: '#eeeeee', dark: '#444444', border: '#111111',
    selected: 'rgba(255,255,255,0.4)', legalDot: 'rgba(255,255,255,0.35)',
    lastMove: 'rgba(255,255,255,0.2)', check: 'rgba(255,80,80,0.55)',
    coordinate: '#888888',
  },
};

export const PIECE_THEMES: Record<string, { displayName: string }> = {
  merida: { displayName: 'Merida' },
  alpha: { displayName: 'Alpha' },
};
