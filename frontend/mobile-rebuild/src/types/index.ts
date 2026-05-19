// ============================================================
// src/types/index.ts — All shared TypeScript interfaces
// ============================================================

// ---------- User / Auth ----------
export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  rating: number;
  isGuest: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ---------- Game / Match ----------
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type Square = string; // e.g. 'e4', 'a1'

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface MoveData {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

export interface MoveRecord {
  san: string;   // Standard Algebraic Notation
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  fen: string;   // FEN after this move
}

export type TimeControl = {
  label: string;        // e.g. 'Blitz 5+0'
  initialTime: number;  // seconds
  increment: number;    // seconds added after each move
};

export const TIME_CONTROLS: TimeControl[] = [
  { label: 'Bullet 1+0',     initialTime: 60,   increment: 0  },
  { label: 'Blitz 3+2',      initialTime: 180,  increment: 2  },
  { label: 'Blitz 5+0',      initialTime: 300,  increment: 0  },
  { label: 'Rapid 10+0',     initialTime: 600,  increment: 0  },
  { label: 'Classical 15+10',initialTime: 900,  increment: 10 },
];

export interface PlayerInfo {
  id: string;
  username: string;
  rating: number;
  avatarUrl?: string;
  color: PieceColor;
}

export type GameResult = 'win' | 'lose' | 'draw';
export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'resignation'
  | 'timeout'
  | 'draw_agreed'
  | 'insufficient_material'
  | 'fifty_move'
  | 'threefold_repetition'
  | 'opponent_left';

export interface GameState {
  matchId: string | null;
  fen: string;
  turn: PieceColor;
  moves: MoveRecord[];
  myColor: PieceColor | null;
  opponent: PlayerInfo | null;
  myTimeMs: number;
  opponentTimeMs: number;
  status: 'idle' | 'playing' | 'ended';
  result: GameResult | null;
  endReason: GameEndReason | null;
  drawOfferedBy: string | null;
  rematchOffered: boolean;
  capturedByMe: ChessPiece[];     // pieces I captured from opponent
  capturedByOpponent: ChessPiece[]; // pieces opponent captured from me
  lastMove: { from: Square; to: Square } | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
}

// ---------- Socket Events ----------
export interface SocketMatchFound {
  matchId: string;
  white: PlayerInfo;
  black: PlayerInfo;
  timeControl: TimeControl;
}

export interface SocketMoveMade {
  matchId: string;
  move: MoveData & { san: string };
  fen: string;
  turn: PieceColor;
  times: { w: number; b: number }; // remaining ms
}

export interface SocketGameOver {
  matchId: string;
  result: 'white' | 'black' | 'draw';
  reason: GameEndReason;
  winner: string | null; // player id
}

export interface SocketDrawOffered  { matchId: string; by: string; }
export interface SocketRematchReady { matchId: string; newMatchId: string; }
export interface SocketOpponentLeft { matchId: string; }
export interface SocketError        { code: string; message: string; }

// ---------- Settings ----------
export interface SettingsState {
  soundEnabled: boolean;
  soundVolume: number;      // 0–1
  hapticsEnabled: boolean;
  showLegalMoves: boolean;
  showLastMoveHighlight: boolean;
  boardTheme: 'classic' | 'green' | 'blue';
  pieceTheme: 'merida' | 'alpha' | 'neo';
}

// ---------- Navigation ----------
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined; // bottom tabs
  Matchmaking: { timeControl: TimeControl };
  Game: { matchId: string };
  PostGame: { matchId: string; result: GameResult; reason: GameEndReason };
  Replay: { matchId: string; moves: MoveRecord[] };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};
