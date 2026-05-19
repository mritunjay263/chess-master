// src/hooks/useChessGame.ts
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSocket } from './useSocket';
import type { Square, PromotionPiece } from '../types';

export function useChessGame() {
  const {
    myColor, turn, status, selectedSquare,
    selectSquare, applyMove, setPendingPromotion, pendingPromotion,
  } = useGameStore();
  const { emit } = useSocket();

  const handleSquarePress = useCallback((sq: Square) => {
    if (status !== 'active') return;
    if (turn !== myColor) return; // not your turn

    const { selectedSquare: sel, _chess, legalMoves } = useGameStore.getState();

    if (sel) {
      if (legalMoves.includes(sq)) {
        // Check for promotion
        const piece = _chess.get(sel);
        const isPromotion =
          piece?.type === 'p' &&
          ((myColor === 'w' && sq[1] === '8') || (myColor === 'b' && sq[1] === '1'));

        if (isPromotion) {
          // BUG-4: hold the move, show promotion sheet
          setPendingPromotion({ from: sel, to: sq });
          return;
        }
        _executeMove(sel, sq, undefined, emit, applyMove);
      } else if (sq === sel) {
        selectSquare(null);
      } else {
        // tap own piece — reselect
        const piece2 = _chess.get(sq);
        if (piece2?.color === myColor) selectSquare(sq);
        else selectSquare(null);
      }
    } else {
      const piece = _chess.get(sq);
      if (piece?.color === myColor) selectSquare(sq);
    }
  }, [myColor, turn, status]);

  const handlePromotion = useCallback((promoteTo: PromotionPiece) => {
    const { pendingPromotion: pp } = useGameStore.getState();
    if (!pp) return;
    setPendingPromotion(null);
    _executeMove(pp.from, pp.to, promoteTo, emit, applyMove);
  }, []);

  const resign = useCallback(() => emit('resign'), []);
  const offerDraw = useCallback(() => emit('offer_draw'), []);
  const requestRematch = useCallback(() => {
    emit('request_rematch');
    useGameStore.getState().setRematchOffered(true);
  }, []);

  return {
    myColor,
    alert: useGameStore(s => s.alert),
    pendingPromotion: useGameStore(s => s.pendingPromotion),
    handleSquarePress,
    handlePromotion,
    resign,
    offerDraw,
    requestRematch,
  };
}

function _executeMove(
  from: Square, to: Square, promotion: PromotionPiece | undefined,
  emit: (ev: string, d?: any) => void,
  applyMove: (m: any) => void,
) {
  const { _chess } = useGameStore.getState();
  const result = _chess.move({ from, to, promotion });
  if (!result) return; // illegal — chess.js rejects it
  // Undo so server is authoritative; server will echo back via 'move_made'
  _chess.undo();
  emit('make_move', { from, to, promotion });
}
