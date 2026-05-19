// src/store/gameStore.ts — BUG-1: reset on matchId change, BUG-2: listener cleanup via zustand
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Chess } from 'chess.js';
import type { ChessMove, GameResult, ChessPlayer, GameStatus, Square, PieceColor, PromotionPiece } from '../types';

interface PendingPromotion { from: Square; to: Square; }

interface GameState {
  // Core
  matchId: string | null;
  myColor: PieceColor;
  status: GameStatus;
  turn: PieceColor;
  result: GameResult | null;
  white: ChessPlayer | null;
  black: ChessPlayer | null;
  moves: ChessMove[];
  // BUG-3: expose the chess.js instance directly so board always reads live state
  _chess: Chess;
  // UI
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  pendingPromotion: PendingPromotion | null;
  isFlipped: boolean;
  alert: string | null;
  // Timer
  whiteTime: number;
  blackTime: number;
  // Rematch / draw
  rematchOffered: boolean;
  drawOfferedBy: PieceColor | null;
  // Actions
  setMatch: (matchId: string, myColor: PieceColor, white: ChessPlayer, black: ChessPlayer, timeMs: number) => void;
  applyMove: (move: ChessMove) => void;
  setPendingPromotion: (p: PendingPromotion | null) => void;
  selectSquare: (sq: Square | null) => void;
  setStatus: (s: GameStatus, result?: GameResult) => void;
  setWhiteTime: (ms: number) => void;
  setBlackTime: (ms: number) => void;
  setAlert: (msg: string | null) => void;
  setRematchOffered: (v: boolean) => void;
  setDrawOffered: (color: PieceColor | null) => void;
  acceptDraw?: () => void;
  resetGame: () => void;
}

const makeChess = () => new Chess();

export const useGameStore = create<GameState>()(immer((set, get) => ({
  matchId: null,
  myColor: 'w',
  status: 'waiting',
  turn: 'w',
  result: null,
  white: null,
  black: null,
  moves: [],
  _chess: makeChess(), // BUG-3: always read board from here
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  pendingPromotion: null,
  isFlipped: false,
  alert: null,
  whiteTime: 300000,
  blackTime: 300000,
  rematchOffered: false,
  drawOfferedBy: null,

  // BUG-1: full reset on every new matchId
  setMatch: (matchId, myColor, white, black, timeMs) => set(state => {
    state.matchId = matchId;
    state.myColor = myColor;
    state.white = white;
    state.black = black;
    state.status = 'active';
    state.turn = 'w';
    state.result = null;
    state.moves = [];
    state._chess = makeChess();  // fresh instance
    state.selectedSquare = null;
    state.legalMoves = [];
    state.lastMove = null;
    state.pendingPromotion = null;
    state.isFlipped = myColor === 'b';
    state.alert = null;
    state.whiteTime = timeMs;
    state.blackTime = timeMs;
    state.rematchOffered = false;
    state.drawOfferedBy = null;
  }),

  applyMove: (move) => set(state => {
    state._chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    state.moves.push(move);
    state.turn = state._chess.turn();
    state.lastMove = { from: move.from, to: move.to };
    state.selectedSquare = null;
    state.legalMoves = [];
    // check/checkmate alerts
    if (state._chess.isCheckmate()) state.alert = 'checkmate';
    else if (state._chess.isCheck()) state.alert = 'check';
    else if (state._chess.isStalemate()) state.alert = 'stalemate';
    else if (state._chess.isDraw()) state.alert = 'draw';
    else state.alert = null;
  }),

  selectSquare: (sq) => set(state => {
    state.selectedSquare = sq;
    if (sq) {
      state.legalMoves = state._chess
        .moves({ square: sq, verbose: true })
        .map((m: any) => m.to);
    } else {
      state.legalMoves = [];
    }
  }),

  setPendingPromotion: (p) => set(state => { state.pendingPromotion = p; }),
  setStatus: (s, result) => set(state => { state.status = s; if (result) state.result = result; }),
  setWhiteTime: (ms) => set(state => { state.whiteTime = ms; }),
  setBlackTime: (ms) => set(state => { state.blackTime = ms; }),
  setAlert: (msg) => set(state => { state.alert = msg; }),
  setRematchOffered: (v) => set(state => { state.rematchOffered = v; }),
  setDrawOffered: (color) => set(state => { state.drawOfferedBy = color; }),

  resetGame: () => set(state => {
    state.matchId = null;
    state.status = 'waiting';
    state.result = null;
    state.moves = [];
    state._chess = makeChess();
    state.selectedSquare = null;
    state.legalMoves = [];
    state.lastMove = null;
    state.pendingPromotion = null;
    state.alert = null;
    state.rematchOffered = false;
    state.drawOfferedBy = null;
  }),
})));
