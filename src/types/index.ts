// src/types/index.ts
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square = string;
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export interface Piece { type: PieceType; color: PieceColor; }

export interface ChessMove {
  from: Square; to: Square;
  promotion?: PromotionPiece;
  san?: string; captured?: PieceType; flags?: string;
}

export interface TimeControlOption {
  label: string; initial: number; increment: number;
}

export interface PlayerInfo {
  id: string; username: string; rating: number;
  avatarUrl?: string; color: PieceColor;
}

export interface GameResult {
  winner: PieceColor | 'draw' | null;
  reason: 'checkmate'|'resignation'|'timeout'|'draw'|'stalemate'|'agreement'|'opponent_left';
}

export interface GameState {
  matchId: string | null; fen: string; turn: PieceColor;
  moves: ChessMove[]; whiteTime: number; blackTime: number;
  status: 'idle'|'playing'|'finished'; result: GameResult | null;
  white: PlayerInfo | null; black: PlayerInfo | null;
  timeControl: TimeControlOption | null;
  selectedSquare: Square | null; legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  pendingPromotion: { from: Square; to: Square } | null;
  isFlipped: boolean; drawOfferedBy: PieceColor | null;
  rematchOffered: boolean;
}

export interface User {
  id: string; username: string; email?: string;
  rating: number; wins: number; losses: number; draws: number;
  avatarUrl?: string; token?: string;
}

export interface RecentGame {
  matchId: string; opponentUsername: string; opponentRating: number;
  result: 'win'|'loss'|'draw'; myColor: PieceColor;
  pgn: string; playedAt: string; timeControl: string;
}

export interface AppSettings {
  soundEnabled: boolean; volume: number;
  hapticsEnabled: boolean;
  boardTheme: 'Classic'|'Green'|'Blue';
  pieceTheme: 'Merida'|'Alpha'|'Neo';
  showLegalMoves: boolean; showLastMove: boolean;
}

// Socket payloads
export interface MatchFoundPayload { matchId: string; white: PlayerInfo; black: PlayerInfo; timeControl: TimeControlOption; }
export interface MoveMadePayload { matchId: string; move: ChessMove; fen: string; turn: PieceColor; times: { white: number; black: number }; }
export interface GameOverPayload { matchId: string; result: GameResult; }
export interface DrawOfferedPayload { matchId: string; by: PieceColor; }
export interface RematchReadyPayload { matchId: string; newMatchId: string; }
export interface OpponentLeftPayload { matchId: string; }
export interface ErrorPayload { code: string; message: string; }

// Nav
export type RootStackParamList = {
  Splash: undefined; Auth: undefined; Main: undefined;
  Game: { matchId: string }; PostGame: { matchId: string; result: GameResult };
  Replay: { pgn: string; matchId: string }; Matchmaking: undefined;
};
export type TabParamList = { Home: undefined; Profile: undefined; Settings: undefined; };
