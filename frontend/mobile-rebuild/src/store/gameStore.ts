// ============================================================
// src/store/gameStore.ts — Live game state (NOT persisted)
// [BUG-1 FIX] resetGame() fully wipes all state for new match
// ============================================================
import { create } from 'zustand';
import type {
  GameState, PieceColor, MoveRecord, ChessPiece,
  GameResult, GameEndReason, PlayerInfo, Square,
} from '../types';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const DEFAULT_STATE: GameState = {
  matchId: null,
  fen: INITIAL_FEN,
  turn: 'w',
  moves: [],
  myColor: null,
  opponent: null,
  myTimeMs: 0,
  opponentTimeMs: 0,
  status: 'idle',
  result: null,
  endReason: null,
  drawOfferedBy: null,
  rematchOffered: false,
  capturedByMe: [],
  capturedByOpponent: [],
  lastMove: null,
  isCheck: false,
  isCheckmate: false,
  isDraw: false,
};

interface GameStore extends GameState {
  // Called when match_found fires — resets everything [BUG-1]
  startGame: (
    matchId: string,
    myColor: PieceColor,
    opponent: PlayerInfo,
    initialTimeMs: number
  ) => void;

  // Apply a move received from server [BUG-3: derive from FEN only]
  applyMove: (params: {
    fen: string;
    move: MoveRecord;
    turn: PieceColor;
    myTimeMs: number;
    opponentTimeMs: number;
    capturedPiece?: ChessPiece;
    capturedBy: PieceColor;
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
  }) => void;

  setGameOver: (result: GameResult, reason: GameEndReason) => void;
  setDrawOffer: (by: string | null) => void;
  setRematchOffered: (v: boolean) => void;
  syncTimes: (myMs: number, opponentMs: number) => void;
  resetGame: () => void; // [BUG-1 FIX]
}

export const useGameStore = create<GameStore>()((set) => ({
  ...DEFAULT_STATE,

  startGame: (matchId, myColor, opponent, initialTimeMs) =>
    // Full reset then apply match params — fixes BUG-1
    set({
      ...DEFAULT_STATE,
      matchId,
      myColor,
      opponent,
      myTimeMs: initialTimeMs,
      opponentTimeMs: initialTimeMs,
      status: 'playing',
    }),

  applyMove: (params) =>
    set((state) => {
      // Captured pieces tracking
      const captured = params.capturedPiece
        ? params.capturedBy === state.myColor
          ? { capturedByMe: [...state.capturedByMe, params.capturedPiece] }
          : { capturedByOpponent: [...state.capturedByOpponent, params.capturedPiece] }
        : {};

      return {
        fen: params.fen,           // BUG-3: board derives from FEN
        turn: params.turn,
        moves: [...state.moves, params.move],
        lastMove: { from: params.move.from, to: params.move.to },
        myTimeMs: params.myTimeMs,
        opponentTimeMs: params.opponentTimeMs,
        isCheck: params.isCheck,
        isCheckmate: params.isCheckmate,
        isDraw: params.isDraw,
        ...captured,
      };
    }),

  setGameOver: (result, reason) =>
    set({ status: 'ended', result, endReason: reason }),

  setDrawOffer: (by) => set({ drawOfferedBy: by }),

  setRematchOffered: (v) => set({ rematchOffered: v }),

  syncTimes: (myMs, opponentMs) =>
    set({ myTimeMs: myMs, opponentTimeMs: opponentMs }),

  resetGame: () => set({ ...DEFAULT_STATE }), // BUG-1 FIX
}));
