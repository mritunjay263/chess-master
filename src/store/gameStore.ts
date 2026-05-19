// src/store/gameStore.ts — BUG-1 fix: fresh Chess() on every startGame/reset
import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { GameState, PieceColor, ChessMove, Square, GameResult, PlayerInfo, TimeControlOption, PromotionPiece } from '../types';

const INIT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function buildInitial(): GameState {
  return {
    matchId: null, fen: INIT_FEN, turn: 'w', moves: [],
    whiteTime: 0, blackTime: 0, status: 'idle', result: null,
    white: null, black: null, timeControl: null,
    selectedSquare: null, legalMoves: [], lastMove: null,
    pendingPromotion: null, isFlipped: false,
    drawOfferedBy: null, rematchOffered: false,
  };
}

interface GameStore extends GameState {
  _chess: Chess;
  startGame: (p: { matchId:string; white:PlayerInfo; black:PlayerInfo; timeControl:TimeControlOption; myColor:PieceColor }) => void;
  applyMove: (m: { from:Square; to:Square; promotion?:PromotionPiece; fen:string; times:{white:number;black:number}; san?:string; captured?:string }) => void;
  selectSquare: (sq:Square, myColor:PieceColor) => void;
  setPendingPromotion: (m:{from:Square;to:Square}|null) => void;
  setResult: (r:GameResult) => void;
  setTimes: (w:number, b:number) => void;
  flipBoard: () => void;
  setDrawOffered: (by:PieceColor|null) => void;
  setRematchOffered: (v:boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...buildInitial(), _chess: new Chess(),

  startGame: ({ matchId, white, black, timeControl, myColor }) => {
    // BUG-1: brand new Chess() instance so no stale move history
    const chess = new Chess();
    set({ ...buildInitial(), _chess: chess, matchId, white, black, timeControl,
      whiteTime: timeControl.initial*1000, blackTime: timeControl.initial*1000,
      status: 'playing', fen: chess.fen(), turn: 'w', isFlipped: myColor==='b' });
  },

  applyMove: ({ from, to, promotion, fen, times, san, captured }) => {
    const { _chess } = get();
    try { _chess.move({ from, to, promotion }); } catch { _chess.load(fen); }
    // BUG-3: always derive state from chess.js, never from local cache
    set((s) => ({
      fen: _chess.fen(), turn: _chess.turn() as PieceColor,
      moves: [...s.moves, { from, to, promotion, san, captured: captured as any }],
      lastMove: { from, to }, whiteTime: times.white, blackTime: times.black,
      selectedSquare: null, legalMoves: [], pendingPromotion: null,
    }));
  },

  selectSquare: (square, myColor) => {
    const { _chess, selectedSquare, status, turn } = get();
    if (status !== 'playing' || turn !== myColor) return;
    if (selectedSquare && selectedSquare !== square) {
      const legal = (_chess.moves({ square: selectedSquare as any, verbose:true }) as any[]).map(m=>m.to);
      if (legal.includes(square)) {
        const piece = _chess.get(selectedSquare as any);
        const isPromo = piece?.type==='p' && ((myColor==='w'&&square[1]==='8')||(myColor==='b'&&square[1]==='1'));
        if (isPromo) { set({ pendingPromotion:{from:selectedSquare,to:square}, selectedSquare:null, legalMoves:[] }); return; }
        set({ selectedSquare:null, legalMoves:[] }); return;
      }
    }
    const piece = _chess.get(square as any);
    if (piece && piece.color===myColor) {
      set({ selectedSquare:square, legalMoves: (_chess.moves({square:square as any,verbose:true}) as any[]).map(m=>m.to) });
    } else { set({ selectedSquare:null, legalMoves:[] }); }
  },

  setPendingPromotion: (m) => set({ pendingPromotion:m }),
  setResult: (result) => set({ result, status:'finished' }),
  setTimes: (w, b) => set({ whiteTime:w, blackTime:b }),
  flipBoard: () => set(s => ({ isFlipped:!s.isFlipped })),
  setDrawOffered: (by) => set({ drawOfferedBy:by }),
  setRematchOffered: (v) => set({ rematchOffered:v }),
  // BUG-1: new Chess() so history is truly cleared
  resetGame: () => set({ ...buildInitial(), _chess:new Chess() }),
}));
