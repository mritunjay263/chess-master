// src/types/index.ts
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type PieceColor = 'w' | 'b';
export type Square = string; // e.g. 'e4'
export type GameStatus = 'waiting' | 'active' | 'finished';

export interface ChessMove {
  from: Square;
  to: Square;
  san: string;
  flags: string;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PromotionPiece;
}

export interface GameResult {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
}

export interface ChessPlayer {
  id: string;
  username: string;
  rating: number;
}

export interface User {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  boardTheme: 'Classic' | 'Green' | 'Blue';
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Matchmaking: undefined;
  Game: { matchId: string };
  PostGame: { matchId: string; result: GameResult };
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
