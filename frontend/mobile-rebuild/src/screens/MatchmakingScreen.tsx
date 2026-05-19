// src/screens/MatchmakingScreen.tsx — join queue with live socket status
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useSocketContext } from '@api/SocketContext';
import { useGameStore } from '@store/gameStore';
import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import type { TimeControl, PlayerInfo, Color } from '@/types/index';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'Matchmaking'>;
type Route = RouteProp<RootStackParamList, 'Matchmaking'>;

const TIME_CONTROL_MAP: Record<string, TimeControl> = {
  bullet:    { key: 'bullet',    label: '1 min',  baseSeconds: 60,   incrementSeconds: 0 },
  blitz3:    { key: 'blitz3',    label: '3 min',  baseSeconds: 180,  incrementSeconds: 2 },
  blitz5:    { key: 'blitz5',    label: '5 min',  baseSeconds: 300,  incrementSeconds: 3 },
  rapid:     { key: 'rapid',     label: '10 min', baseSeconds: 600,  incrementSeconds: 5 },
  classical: { key: 'classical', label: '30 min', baseSeconds: 1800, incrementSeconds: 10 },
};

type QueueState = 'idle' | 'waiting' | 'found';

export const MatchmakingScreen: React.FC = () => {
  const nav   = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { socket, connected } = useSocketContext();
  const startMatch = useGameStore((s) => s.startMatch);

  const tcKey  = route.params?.timeControlKey ?? 'blitz5';
  const tc     = TIME_CONTROL_MAP[tcKey];
  const [state,   setState]   = useState<QueueState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleJoin = () => {
    if (!socket || !connected) return;
    socket.emit(SOCKET_EMIT.JOIN_QUEUE, { timeControlKey: tcKey });
    setState('waiting');
    startTimer();
  };

  const handleCancel = () => {
    if (socket) socket.emit(SOCKET_EMIT.LEAVE_QUEUE);
    stopTimer();
    setState('idle');
    nav.goBack();
  };

  useEffect(() => {
    if (!socket) return;
    const onMatchFound = (data: { matchId: string; white: PlayerInfo; black: PlayerInfo; myColor: Color; timeControl: TimeControl; fen?: string }) => {
      stopTimer();
      setState('found');
      startMatch({ matchId: data.matchId, white: data.white, black: data.black, myColor: data.myColor, timeControl: data.timeControl, fen: data.fen });
      setTimeout(() => {
        nav.replace('Game', { matchId: data.matchId, white: data.white, black: data.black, myColor: data.myColor, timeControl: data.timeControl });
      }, 600);
    };
    socket.on(SOCKET_ON.MATCH_FOUND, onMatchFound);
    return () => { socket.off(SOCKET_ON.MATCH_FOUND, onMatchFound); stopTimer(); };
  }, [socket]);

  const fmtElapsed = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  return (
    <View style={styles.root}>
      <Text style={styles.crown}>♛</Text>
      <Text style={styles.tcLabel}>{tc.label} · {tc.key.charAt(0).toUpperCase() + tc.key.slice(1)}</Text>
      {state === 'idle' && (
        <>
          <Text style={styles.sub}>Ready to find a match?</Text>
          {!connected && <Text style={styles.warn}>⚠ No connection. Check your server.</Text>}
          <Pressable
            style={({ pressed }) => [styles.btn, !connected && styles.btnDisabled, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleJoin} disabled={!connected}
          >
            <Text style={styles.btnText}>JOIN QUEUE</Text>
          </Pressable>
        </>
      )}
      {state === 'waiting' && (
        <>
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginVertical: SPACING.lg }} />
          <Text style={styles.waitText}>Finding opponent…</Text>
          <Text style={styles.timer}>{fmtElapsed(elapsed)}</Text>
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
        </>
      )}
      {state === 'found' && <Text style={styles.foundText}>♟ Match Found!</Text>}
      {state !== 'found' && (
        <Pressable style={styles.backLink} onPress={handleCancel}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  crown:     { fontSize: 72, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  tcLabel:   { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 1, marginBottom: SPACING.md },
  sub:       { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xl },
  warn:      { color: COLORS.danger, fontSize: 13, marginBottom: SPACING.md, textAlign: 'center' },
  btn:       { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md },
  btnDisabled: { opacity: 0.4 },
  btnText:   { color: COLORS.onPrimary, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  waitText:  { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  timer:     { color: COLORS.textPrimary, fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'], marginVertical: SPACING.md },
  cancelBtn: { marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  cancelText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  foundText: { color: COLORS.success, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  backLink:  { position: 'absolute', bottom: 40 },
  backText:  { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
