// src/screens/GameScreen.tsx — the core gameplay screen.
//
// Wires together every BUG fix from the spec:
//   BUG-1: full reset on matchId change (delegated to useChessGame + gameStore.startMatch)
//   BUG-2: scoped socket listeners with cleanup in useEffect return
//   BUG-3: board derives state purely from chess.js .board()
//   BUG-4: promotion dialog as bottom-sheet (PromotionModal)
//   BUG-5: server timestamp drives the timer (useTimer)
//   BUG-6: rematch flow with explicit accept/decline + resetGame
//   BUG-7: check/checkmate/draw announced via banner + haptic + sound
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Board } from '@components/Board/Board';
import { PlayerInfoBar } from '@components/PlayerInfoBar';
import { PromotionModal } from '@components/PromotionModal';
import { CheckBanner } from '@components/CheckBanner';
import { MoveHistoryList } from '@components/MoveHistoryList';
import { Button } from '@components/Button';
import { Toast } from '@components/Toast';

import { useChessGame } from '@hooks/useChessGame';
import { useTimer } from '@hooks/useTimer';
import { useSocket } from '@hooks/useSocket';
import { useHaptics } from '@hooks/useHaptics';
import { useGameStore } from '@store/gameStore';
import { useUserStore } from '@store/userStore';

import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';
import { SOUND_KEYS } from '@/constants/sounds';
import { COLORS, SPACING } from '@/constants/theme';
import { soundManager } from '@utils/soundManager';
import { AIApi } from '@api/client';

import type { ChessMove, Color, GameResult, ServerTimes, Square } from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Game'>;
type Route = RouteProp<RootStackParamList, 'Game'>;

export const GameScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { matchId, white, black, myColor, timeControl } = route.params;

  const user = useUserStore((s) => s.user);
  const haptics = useHaptics();
  const { socket, emit } = useSocket();

  // Detect single player vs AI mode
  const isAI = matchId.startsWith('ai-');
  const aiDifficulty = isAI ? parseInt(matchId.split('-')[2] || '5', 10) : 5;
  const aiColor = white.id === 'ai' ? 'w' : 'b';

  const game = useGameStore();
  const chess = useChessGame({ matchId });
  const [toast, setToast] = useState<string | null>(null);
  const [resignConfirm, setResignConfirm] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Stable refs for chess callbacks used inside the socket effect
  // (avoids putting the entire `chess` object in the effect deps, which would
  // re-run the effect on every render and re-emit rejoin_game → state_sync → deselect)
  const applyRemoteRef = useRef(chess.applyRemote);
  applyRemoteRef.current = chess.applyRemote;
  const loadFenRef = useRef(chess.loadFen);
  loadFenRef.current = chess.loadFen;

  // ----- Initialise/reset gameStore on match change (BUG-1) -----
  useEffect(() => {
    useGameStore.getState().startMatch({
      matchId,
      white,
      black,
      myColor,
      timeControl,
    });
    soundManager.play(SOUND_KEYS.GAME_START);
  }, [matchId, white, black, myColor, timeControl]);

  // ----- AI move logic for single player -----
  const chessRef = useRef(chess);
  chessRef.current = chess;

  useEffect(() => {
    if (!isAI || chess.isGameOver) return;
    if (chess.turn === aiColor && !aiThinking) {
      // AI's turn - get move from server or use local fallback
      const makeAIMove = async () => {
        setAiThinking(true);
        try {
          const fen = chessRef.current.fen;
          const response = await AIApi.getMove(fen, aiDifficulty);
          const aiMove = response.data.move;
          if (aiMove) {
            const move = chessRef.current.tryMove(aiMove.from as Square, aiMove.to as Square, aiMove.promotion as 'q' | 'r' | 'b' | 'n');
            if (move) {
              // Apply move locally (no socket emit for AI)
              useGameStore.getState().applyServerMove({
                move,
                fen: chessRef.current.fen,
                turn: aiColor,
                times: { whiteMs: game.whiteTimeMs, blackMs: game.blackTimeMs, serverTimestamp: Date.now() },
              });
            }
          }
        } catch (err) {
          console.warn('[GameScreen] AI move failed, using local fallback:', err);
          // Fallback: make random legal move
          const moves = chessRef.current.legalMoves;
          if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            chessRef.current.tryMove(randomMove.from, randomMove.to);
          }
        } finally {
          setAiThinking(false);
        }
      };
      // Small delay for realistic feel
      setTimeout(makeAIMove, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAI, chess.turn, chess.isGameOver, aiColor, aiDifficulty]);

  // ----- Socket listeners (BUG-2: scoped, cleaned up on unmount) -----
  useEffect(() => {
    if (!socket) return;

    const onMoveMade = (data: {
      matchId: string;
      move: ChessMove;
      fen: string;
      turn: Color;
      times: ServerTimes;
    }) => {
      console.log('[GameScreen] Move made received:', data.move, 'myColor:', myColor, 'turn:', data.turn);
      if (data.matchId !== matchId) return;
      if (!data.move || !data.move.from || !data.move.to) {
        console.warn('[GameScreen] Invalid move data received:', data.move);
        return;
      }
      // Only apply moves we did NOT make locally (i.e. opponent's moves).
      // The local player applied their own move optimistically before emitting.
      // If color is missing, assume it's the opponent's move (server should add it)
      const isOurMove = data.move.color != null && data.move.color === myColor;
      console.log('[GameScreen] isOurMove:', isOurMove);
      if (!isOurMove) {
        console.log('[GameScreen] Applying remote move:', data.move);
        applyRemoteRef.current(data.move);
        soundManager.play(SOUND_KEYS.MOVE_OPPONENT);
      }
      // Always sync server times
      useGameStore.getState().applyServerMove({
        move: data.move,
        fen: data.fen,
        turn: data.turn,
        times: data.times,
      });
    };

    const onGameOver = (data: {
      matchId: string;
      result: GameResult['kind'];
      reason: GameResult['reason'];
      winner?: Color;
    }) => {
      if (data.matchId !== matchId) return;
      console.log('[GameScreen] Game over received:', data);
      const result: GameResult = {
        kind: data.winner ? (data.winner === myColor ? 'win' : 'lose') : 'draw',
        reason: data.reason || 'resignation',
        winnerColor: data.winner,
      };
      useGameStore.getState().setResult(result);
      if (result.kind === 'win') {
        soundManager.play(SOUND_KEYS.GAME_END_WIN);
        haptics.win();
      } else if (result.kind === 'lose') {
        soundManager.play(SOUND_KEYS.GAME_END_LOSE);
        haptics.lose();
      } else {
        soundManager.play(SOUND_KEYS.DRAW);
      }
      nav.replace('PostGame', { matchId, result });
    };

    const onDrawOffered = (data: { matchId: string; by: Color }) => {
      if (data.matchId !== matchId) return;
      if (!data.by) {
        console.warn('[GameScreen] Invalid draw offer data:', data);
        return;
      }
      useGameStore.getState().setDrawOffered(data.by);
      setToast('Opponent offers a draw');
      soundManager.play(SOUND_KEYS.NOTIFY);
      haptics.rematchPing();
    };
    const onDrawDeclined = (data?: { matchId: string }) => {
      if (data && data.matchId !== matchId) return;
      setToast('Draw offer declined');
      useGameStore.getState().setDrawOffered(null);
    };

    const onRematchOffered = (data: { matchId: string }) => {
      if (data.matchId !== matchId) return;
      useGameStore.getState().setRematchOffered(myColor === 'w' ? 'b' : 'w');
      soundManager.play(SOUND_KEYS.NOTIFY);
      haptics.rematchPing();
    };

    const onStateSync = (data: { fen: string; moves: ChessMove[]; times: ServerTimes; turn: Color }) => {
      console.log('[GameScreen] State sync received, loading FEN:', data.fen.substring(0, 30) + '...');
      loadFenRef.current(data.fen);
      useGameStore.getState().syncTimes(data.times);
    };

    const onOpponentLeft = () => {
      console.log('[GameScreen] Opponent left the game');
      setToast('Opponent disconnected');
    };

    socket.on(SOCKET_ON.MOVE_MADE, onMoveMade);
    socket.on(SOCKET_ON.GAME_OVER, onGameOver);
    socket.on(SOCKET_ON.DRAW_OFFERED, onDrawOffered);
    socket.on(SOCKET_ON.DRAW_DECLINED, onDrawDeclined);
    socket.on(SOCKET_ON.REMATCH_OFFERED, onRematchOffered);
    socket.on(SOCKET_ON.STATE_SYNC, onStateSync);
    socket.on(SOCKET_ON.OPPONENT_LEFT, onOpponentLeft);

    // Auto-rejoin in case we mounted after a reconnect
    emit(SOCKET_EMIT.REJOIN_GAME, { matchId, playerId: user?.id });

    return () => {
      socket.off(SOCKET_ON.MOVE_MADE, onMoveMade);
      socket.off(SOCKET_ON.GAME_OVER, onGameOver);
      socket.off(SOCKET_ON.DRAW_OFFERED, onDrawOffered);
      socket.off(SOCKET_ON.DRAW_DECLINED, onDrawDeclined);
      socket.off(SOCKET_ON.REMATCH_OFFERED, onRematchOffered);
      socket.off(SOCKET_ON.STATE_SYNC, onStateSync);
      socket.off(SOCKET_ON.OPPONENT_LEFT, onOpponentLeft);
    };
  }, [socket, matchId, myColor, emit, nav, user]);

  // ----- Per-move side effects: sounds & haptics & check announcement (BUG-7) -----
  const lastMove = chess.history[chess.history.length - 1] ?? null;
  useEffect(() => {
    if (!lastMove) return;
    // Move was applied; figure out which sound to play
    if (lastMove.flags?.includes('k') || lastMove.flags?.includes('q')) {
      soundManager.play(SOUND_KEYS.CASTLE);
    } else if (lastMove.flags?.includes('p')) {
      soundManager.play(SOUND_KEYS.PROMOTE);
      haptics.promote();
    } else if (lastMove.captured) {
      soundManager.play(SOUND_KEYS.CAPTURE);
      haptics.capture();
    } else if (lastMove.color === myColor) {
      soundManager.play(SOUND_KEYS.MOVE_SELF);
      haptics.pieceMoved();
    }
    if (chess.isCheck && !chess.isCheckmate) {
      soundManager.play(SOUND_KEYS.CHECK);
      haptics.check();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chess.history.length]);

  // ----- Tap a square: select / deselect / attempt move -----
  const handleSquarePress = useCallback(
    (sq: Square) => {
      // It's not our turn
      if (chess.turn !== myColor || chess.isGameOver) {
        haptics.illegal();
        return;
      }
      if (chess.selectedSquare === sq) {
        chess.selectSquare(null);
        return;
      }
      if (chess.selectedSquare) {
        const move = chess.tryMove(chess.selectedSquare, sq);
        if (move) {
          emitMove(move);
        } else if (chess.pendingPromotion) {
          // PromotionModal will handle it
        } else {
          // Maybe they tapped another of their own pieces — reselect
          const piece = chess.pieces.find((p) => p.square === sq);
          if (piece && piece.color === myColor) {
            chess.selectSquare(sq);
            haptics.pieceSelected();
          } else {
            haptics.illegal();
          }
        }
      } else {
        const piece = chess.pieces.find((p) => p.square === sq);
        if (piece && piece.color === myColor) {
          chess.selectSquare(sq);
          haptics.pieceSelected();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chess.selectedSquare, chess.turn, chess.isGameOver, chess.pieces, myColor],
  );

  // Wrap into a stable callback that has the latest match context for emitting
  function emitMove(move: ChessMove) {
    emit(SOCKET_EMIT.MOVE, {
      matchId,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
  }

  const handlePromotion = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!chess.pendingPromotion) return;
      const move = chess.tryMove(chess.pendingPromotion.from, chess.pendingPromotion.to, piece);
      if (move) emitMove(move);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chess.pendingPromotion],
  );

  // ----- Timer (BUG-5) -----
  const timer = useTimer({
    whiteMs: game.whiteTimeMs,
    blackMs: game.blackTimeMs,
    lastServerSyncAt: game.lastServerSyncAt,
    activeColor: chess.turn,
    paused: chess.isGameOver,
    onFlag: (color) => {
      // Local flag detection — emit a resign-by-timeout. Server confirms.
      emit(SOCKET_EMIT.RESIGN, { matchId, reason: 'timeout', flaggedColor: color });
    },
  });

  // ----- Action buttons -----
  const handleResign = () => {
    if (resignConfirm) {
      console.log('[GameScreen] Emitting resign for match:', matchId);
      const success = emit(SOCKET_EMIT.RESIGN, { matchId });
      console.log('[GameScreen] Resign emit success:', success);
      setResignConfirm(false);
    } else {
      setResignConfirm(true);
      setTimeout(() => setResignConfirm(false), 3000);
    }
  };
  const handleOfferDraw = () => {
    console.log('[GameScreen] Offering draw for match:', matchId);
    Alert.alert('Offer a draw?', 'Your opponent will be notified.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Offer', onPress: () => {
        const success = emit(SOCKET_EMIT.OFFER_DRAW, { matchId });
        console.log('[GameScreen] Draw offer emit success:', success);
      }},
    ]);
  };
  const handleAcceptDraw = () => {
    emit(SOCKET_EMIT.ACCEPT_DRAW, { matchId });
    useGameStore.getState().setDrawOffered(null);
  };
  const handleDeclineDraw = () => {
    emit(SOCKET_EMIT.DECLINE_DRAW, { matchId });
    useGameStore.getState().setDrawOffered(null);
  };
  const handleFlip = () => useGameStore.getState().toggleFlip();

  const opponent = myColor === 'w' ? black : white;
  const oppColor: Color = myColor === 'w' ? 'b' : 'w';
  const myTimeMs = myColor === 'w' ? timer.whiteMs : timer.blackMs;
  const oppTimeMs = myColor === 'w' ? timer.blackMs : timer.whiteMs;
  const totalSeconds = timeControl.baseSeconds;

  const status: 'check' | 'checkmate' | 'stalemate' | 'draw' | null = chess.isCheckmate
    ? 'checkmate'
    : chess.isStalemate
    ? 'stalemate'
    : chess.isDraw
    ? 'draw'
    : chess.isCheck
    ? 'check'
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={styles.barButton}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={handleFlip} hitSlop={12}>
          <Text style={styles.barButton}>⇅ Flip</Text>
        </Pressable>
      </View>

      <PlayerInfoBar
        player={opponent}
        side={oppColor}
        timeMs={oppTimeMs}
        totalSeconds={totalSeconds}
        active={chess.turn === oppColor}
        captures={oppColor === 'w' ? chess.captured.white : chess.captured.black}
        advantage={oppColor === 'w' ? Math.max(0, chess.material) : Math.max(0, -chess.material)}
      />

      <CheckBanner status={status} />

      <View style={styles.boardWrap}>
        <Board
          pieces={chess.pieces}
          selectedSquare={chess.selectedSquare}
          legalTargets={chess.legalTargets}
          lastMove={lastMove}
          checkSquare={chess.checkSquare}
          flipped={game.boardFlipped}
          onSquarePress={handleSquarePress}
        />
      </View>

      <PlayerInfoBar
        player={myColor === 'w' ? white : black}
        side={myColor}
        timeMs={myTimeMs}
        totalSeconds={totalSeconds}
        active={chess.turn === myColor}
        captures={myColor === 'w' ? chess.captured.white : chess.captured.black}
        advantage={myColor === 'w' ? Math.max(0, chess.material) : Math.max(0, -chess.material)}
      />

      <View style={styles.actions}>
        <Button
          label={resignConfirm ? 'Tap again to resign' : 'Resign'}
          variant={resignConfirm ? 'danger' : 'secondary'}
          onPress={handleResign}
          style={{ flex: 1 }}
        />
        <View style={{ width: SPACING.sm }} />
        {game.drawOfferedBy && game.drawOfferedBy !== myColor ? (
          <>
            <Button label="Accept draw" onPress={handleAcceptDraw} style={{ flex: 1 }} />
            <View style={{ width: SPACING.sm }} />
            <Button label="Decline" onPress={handleDeclineDraw} variant="ghost" style={{ flex: 1 }} />
          </>
        ) : (
          <Button label="Offer draw" variant="secondary" onPress={handleOfferDraw} style={{ flex: 1 }} />
        )}
      </View>

      {chess.history.length > 0 && (
        <View style={styles.history}>
          <MoveHistoryList moves={chess.history} />
        </View>
      )}

      <PromotionModal
        visible={!!chess.pendingPromotion}
        color={myColor}
        onPick={handlePromotion}
        onCancel={chess.cancelPromotion}
      />

      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.sm },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  barButton: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  boardWrap: { alignItems: 'center', marginVertical: SPACING.sm },
  actions: { flexDirection: 'row', marginTop: SPACING.sm },
  history: { marginTop: SPACING.sm },
});
