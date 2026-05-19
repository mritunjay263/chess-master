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
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '@components/Board/Board';
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
  const { socket, connected, emit } = useSocket();

  // Detect single player vs AI mode
  const isAI = matchId.startsWith('ai-');
  const aiDifficulty = isAI ? parseInt(matchId.split('-')[2] || '5', 10) : 5;
  const aiColor = white.id === 'ai' ? 'w' : 'b';

  const insets = useSafeAreaInsets();
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

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable onPress={() => nav.goBack()} hitSlop={12}>
            <Text style={styles.topBarMenu}>☰</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>GRANDMASTER</Text>
        </View>
        <Pressable style={styles.topBarAvatar} onPress={handleFlip}>
          <Text style={styles.topBarAvatarText}>
            {user?.username?.[0]?.toUpperCase() ?? 'G'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Opponent Bar */}
        <View style={styles.playerBar}>
          <View style={styles.playerBarLeft}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>
                {opponent.username[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerBarName}>{opponent.username}</Text>
                <View style={styles.eloBadge}>
                  <Text style={styles.eloBadgeText}>{opponent.rating}</Text>
                </View>
              </View>
              <Text style={styles.playerCountry}>Norway</Text>
            </View>
          </View>
          <View style={styles.timerContainer}>
            <Text style={styles.timerSide}>{oppColor === 'w' ? 'White' : 'Black'}</Text>
            <Text style={styles.timerValue}>{formatTime(oppTimeMs)}</Text>
          </View>
        </View>

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

        {/* User Bar */}
        <View style={[styles.playerBar, styles.playerBarUser]}>
          <View style={styles.playerBarLeft}>
            <View style={[styles.playerAvatar, styles.playerAvatarUser]}>
              <Text style={styles.playerAvatarText}>
                {(myColor === 'w' ? white : black).username[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerBarName}>
                  {(myColor === 'w' ? white : black).username}
                </Text>
                <View style={[styles.eloBadge, styles.eloBadgeUser]}>
                  <Text style={[styles.eloBadgeText, styles.eloBadgeTextUser]}>
                    {(myColor === 'w' ? white : black).rating}
                  </Text>
                </View>
              </View>
              <Text style={styles.playerCountry}>United Kingdom</Text>
            </View>
          </View>
          <View style={[styles.timerContainer, styles.timerContainerUser]}>
            <Text style={[styles.timerSide, styles.timerSideUser]}>
              {myColor === 'w' ? 'White' : 'Black'}
            </Text>
            <Text style={[styles.timerValue, styles.timerValueUser]}>
              {formatTime(myTimeMs)}
            </Text>
          </View>
        </View>

        {/* Move History & Controls */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Move History</Text>
            <Text style={styles.historyIcon}>⏱</Text>
          </View>
          {chess.history.length > 0 ? (
            <View style={styles.historyList}>
              <MoveHistoryList moves={chess.history} />
            </View>
          ) : (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyText}>No moves yet</Text>
            </View>
          )}

          {/* Game Status */}
          <View style={styles.gameStatus}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Accuracy</Text>
              <Text style={styles.statusValue}>—</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Advantage</Text>
              <Text
                style={[
                  styles.statusValue,
                  chess.material >= 0
                    ? styles.statusAdvantage
                    : { color: COLORS.danger },
                ]}
              >
                {chess.material >= 0 ? '+' : ''}
                {chess.material.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {game.drawOfferedBy && game.drawOfferedBy !== myColor ? (
              <>
                <Pressable style={styles.actionAccept} onPress={handleAcceptDraw}>
                  <Text style={styles.actionAcceptText}>Accept Draw</Text>
                </Pressable>
                <Pressable style={styles.actionDecline} onPress={handleDeclineDraw}>
                  <Text style={styles.actionDeclineText}>Decline</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.actionDraw} onPress={handleOfferDraw}>
                <Text style={styles.actionDrawText}>Draw</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.actionResign,
                resignConfirm && styles.actionResignConfirm,
              ]}
              onPress={handleResign}
            >
              <Text
                style={[
                  styles.actionResignText,
                  resignConfirm && styles.actionResignTextConfirm,
                ]}
              >
                {resignConfirm ? 'Tap again' : 'Resign'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Connection Status */}
      <View style={[styles.connBadge, { top: insets.top + 8 }]}>
        <View style={[styles.connDot, { backgroundColor: connected ? '#4CAF50' : '#FF5252' }]} />
        <Text style={styles.connText}>{connected ? 'Connected' : 'Offline'}</Text>
      </View>

      {/* LIVE Indicator */}
      <View style={[styles.liveBadge, { top: insets.top + 44 }]}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

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
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(68,71,77,0.15)',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarMenu: { fontSize: 22, color: COLORS.textPrimary },
  topBarTitle: {
    fontFamily: 'Georgia', fontSize: 16, fontWeight: '600',
    color: COLORS.textPrimary, letterSpacing: 0.5,
  },
  topBarAvatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.2)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  topBarAvatarText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },

  // Player Bar
  playerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
    marginTop: 8,
  },
  playerBarUser: {
    borderTopWidth: 1, borderTopColor: 'rgba(149,211,186,0.2)',
  },
  playerBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerAvatar: {
    width: 44, height: 44, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.1)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  playerAvatarUser: {
    borderColor: 'rgba(149,211,186,0.3)',
  },
  playerAvatarText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerBarName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  eloBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: COLORS.onPrimaryContainer,
    borderRadius: 4,
  },
  eloBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textPrimary },
  eloBadgeUser: { backgroundColor: COLORS.secondaryContainer },
  eloBadgeTextUser: { color: COLORS.secondary },
  playerCountry: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  timerContainer: {
    backgroundColor: COLORS.surfaceContainerHigh, paddingHorizontal: 20,
    paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(68,71,77,0.3)',
    alignItems: 'center',
  },
  timerContainerUser: { borderColor: 'rgba(149,211,186,0.3)' },
  timerSide: { fontSize: 10, fontWeight: '500', color: COLORS.outline, letterSpacing: 1 },
  timerSideUser: { color: COLORS.secondary },
  timerValue: {
    fontFamily: 'Georgia', fontSize: 24, fontWeight: '600',
    color: COLORS.textPrimary, fontVariant: ['tabular-nums'],
  },
  timerValueUser: { color: COLORS.secondary },

  // Board
  boardWrap: { alignItems: 'center', marginVertical: 12 },

  // History Card
  historyCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12, overflow: 'hidden', marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.surfaceContainer,
    borderBottomWidth: 1, borderBottomColor: 'rgba(68,71,77,0.3)',
  },
  historyTitle: {
    fontSize: 13, fontWeight: '600', letterSpacing: 1,
    color: COLORS.primary, textTransform: 'uppercase',
  },
  historyIcon: { fontSize: 16, color: COLORS.outline },
  historyList: { maxHeight: 200 },
  historyEmpty: { padding: 24, alignItems: 'center' },
  historyEmptyText: { color: COLORS.textSecondary, fontSize: 13 },

  // Game Status
  gameStatus: {
    flexDirection: 'row', padding: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(68,71,77,0.3)',
  },
  statusItem: { flex: 1, alignItems: 'center' },
  statusLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  statusValue: {
    fontFamily: 'Georgia', fontSize: 22, fontWeight: '600',
    color: COLORS.secondary,
  },
  statusAdvantage: { color: COLORS.primary },
  statusDivider: {
    width: 1, backgroundColor: 'rgba(68,71,77,0.3)',
  },

  // Actions
  actions: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 0 },
  actionDraw: {
    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 8,
  },
  actionDrawText: {
    color: COLORS.onSecondary, fontSize: 13, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  actionAccept: {
    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 8,
  },
  actionAcceptText: {
    color: COLORS.onSecondary, fontSize: 13, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  actionDecline: {
    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8,
  },
  actionDeclineText: {
    color: COLORS.textPrimary, fontSize: 13, fontWeight: '500',
  },
  actionResign: {
    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.danger, borderRadius: 8,
  },
  actionResignConfirm: { backgroundColor: COLORS.errorContainer },
  actionResignText: {
    color: COLORS.danger, fontSize: 13, fontWeight: '500',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  actionResignTextConfirm: { color: COLORS.textPrimary },

  // Connection Status
  connBadge: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(68,71,77,0.3)',
  },
  connDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  connText: {
    fontSize: 11, fontWeight: '600', color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  // Live Badge
  liveBadge: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(149,211,186,0.3)',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary,
  },
  liveText: {
    fontSize: 11, fontWeight: '600', color: COLORS.secondary,
    letterSpacing: 1,
  },
});
