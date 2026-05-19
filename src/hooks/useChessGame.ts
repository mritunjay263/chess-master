// src/hooks/useChessGame.ts — BUG-4: promotion sheet, BUG-7: check/checkmate alerts
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSocket } from './useSocket';
import { useUserStore } from '../store/userStore';
import { triggerHaptic } from '../utils/hapticManager';
import { playSound } from '../utils/soundManager';
import type { Square, PromotionPiece, PieceColor } from '../types';

export type GameAlert = 'check'|'checkmate'|'draw'|'stalemate'|null;

export function useChessGame() {
  const { matchId, fen, turn, status, _chess } = useGameStore();
  const { emit } = useSocket();
  const { user } = useUserStore();
  const [alert, setAlert] = useState<GameAlert>(null);

  const myColor: PieceColor = useGameStore.getState().white?.id === user?.id ? 'w' : 'b';

  // BUG-7: evaluate game state after every FEN change
  useEffect(() => {
    if (status !== 'playing') return;
    if (_chess.isCheckmate()) {
      setAlert('checkmate');
      const iLost = _chess.turn() === myColor;
      triggerHaptic(iLost ? 'notificationError' : 'notificationSuccess', iLost ? 1 : 2);
      playSound(iLost ? 'game_end_lose' : 'game_end_win');
    } else if (_chess.isStalemate()) {
      setAlert('stalemate'); playSound('draw');
    } else if (_chess.isDraw()) {
      setAlert('draw'); playSound('draw');
    } else if (_chess.isCheck()) {
      setAlert('check'); triggerHaptic('notificationWarning'); playSound('check');
    } else {
      setAlert(null);
    }
  }, [fen]);

  const commitMove = useCallback((from: Square, to: Square, promotion?: PromotionPiece) => {
    if (!matchId) return;
    const { _chess: chess } = useGameStore.getState();
    const result = chess.move({ from, to, promotion });
    if (!result) { triggerHaptic('impactLight'); return; }

    const isCastle = result.flags.includes('k') || result.flags.includes('q');
    const isCapture = !!result.captured;
    if (isCastle) playSound('castle');
    else if (isCapture) { playSound('capture'); triggerHaptic('impactHeavy'); }
    else if (promotion) playSound('promote');
    else playSound('move_self');
    if (!isCapture) triggerHaptic('impactMedium');

    chess.undo(); // optimistic undo — server response is authoritative
    emit('move', { matchId, from, to, promotion });
    useGameStore.getState().setPendingPromotion(null);
  }, [matchId, emit]);

  const handleSquarePress = useCallback((square: Square) => {
    if (status !== 'playing' || turn !== myColor) return;
    const { selectedSquare: sel, _chess: chess } = useGameStore.getState();

    if (sel && sel !== square) {
      const legal = (chess.moves({ square: sel as any, verbose: true }) as any[]).map(m => m.to);
      if (legal.includes(square)) {
        const piece = chess.get(sel as any);
        const isPromo = piece?.type === 'p' &&
          ((myColor === 'w' && square[1] === '8') || (myColor === 'b' && square[1] === '1'));
        if (isPromo) {
          // BUG-4: show promotion sheet instead of auto-queening
          useGameStore.getState().setPendingPromotion({ from: sel, to: square });
          return;
        }
        commitMove(sel, square);
        return;
      }
    }
    useGameStore.getState().selectSquare(square, myColor);
    triggerHaptic('impactLight');
  }, [status, turn, myColor, commitMove]);

  const handlePromotion = useCallback((piece: PromotionPiece) => {
    const pp = useGameStore.getState().pendingPromotion;
    if (pp) commitMove(pp.from, pp.to, piece);
  }, [commitMove]);

  const resign = useCallback(() => { if (matchId) emit('resign', { matchId }); }, [matchId, emit]);
  const offerDraw = useCallback(() => { if (matchId) emit('offer_draw', { matchId }); }, [matchId, emit]);
  const acceptDraw = useCallback(() => { if (matchId) emit('accept_draw', { matchId }); }, [matchId, emit]);
  const declineDraw = useCallback(() => {
    if (matchId) { emit('decline_draw', { matchId }); useGameStore.getState().setDrawOffered(null); }
  }, [matchId, emit]);
  // BUG-6: rematch flow
  const requestRematch = useCallback(() => { if (matchId) emit('rematch_request', { matchId }); }, [matchId, emit]);
  const acceptRematch = useCallback(() => { if (matchId) emit('rematch_accept', { matchId }); }, [matchId, emit]);
  const declineRematch = useCallback(() => {
    if (matchId) { emit('rematch_decline', { matchId }); useGameStore.getState().setRematchOffered(false); }
  }, [matchId, emit]);

  return { myColor, alert, handleSquarePress, handlePromotion, resign, offerDraw, acceptDraw, declineDraw, requestRematch, acceptRematch, declineRematch };
}
