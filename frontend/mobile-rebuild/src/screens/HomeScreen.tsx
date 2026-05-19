// src/screens/HomeScreen.tsx — clean B&W home with time control selector
import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, View, Pressable, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '@store/userStore';
import { useSocketContext } from '@api/SocketContext';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';
import type { TimeControlKey } from '@/types/index';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const TIME_CONTROLS: { key: TimeControlKey; label: string; sub: string; icon: string }[] = [
  { key: 'bullet',    label: '1 min',  sub: 'Bullet',    icon: '⚡' },
  { key: 'blitz3',    label: '3 min',  sub: 'Blitz',     icon: '🔥' },
  { key: 'blitz5',    label: '5 min',  sub: 'Blitz',     icon: '🔥' },
  { key: 'rapid',     label: '10 min', sub: 'Rapid',     icon: '⏱' },
  { key: 'classical', label: '30 min', sub: 'Classical', icon: '♞' },
];

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const { connected, onlineCount } = useSocketContext();
  const [selected, setSelected] = useState<TimeControlKey>('blitz5');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.username}>{user?.username ?? 'Player'}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.dot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.statusText}>{connected ? `${onlineCount} online` : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.boardPreview}>
        <Text style={styles.boardEmoji}>♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</Text>
        <Text style={styles.boardEmoji}>♟ ♟ ♟ ♟ ♟ ♟ ♟ ♟</Text>
        <View style={styles.boardDivider} />
        <Text style={styles.boardEmoji}>♙ ♙ ♙ ♙ ♙ ♙ ♙ ♙</Text>
        <Text style={styles.boardEmoji}>♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖</Text>
      </View>

      <Text style={styles.sectionLabel}>SELECT TIME CONTROL</Text>
      <View style={styles.tcGrid}>
        {TIME_CONTROLS.map(tc => (
          <Pressable
            key={tc.key}
            style={[styles.tcCard, selected === tc.key && styles.tcCardActive]}
            onPress={() => setSelected(tc.key)}
          >
            <Text style={styles.tcIcon}>{tc.icon}</Text>
            <Text style={[styles.tcLabel, selected === tc.key && styles.tcLabelActive]}>{tc.label}</Text>
            <Text style={styles.tcSub}>{tc.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => nav.navigate('Matchmaking', { timeControlKey: selected })}
      >
        <Text style={styles.playBtnText}>FIND MATCH</Text>
      </Pressable>

      {user && !user.isGuest && (
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{user.rating ?? '—'}</Text>
            <Text style={styles.statKey}>Rating</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  welcome:  { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  username: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  boardPreview: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, gap: 2 },
  boardEmoji: { fontSize: 18, letterSpacing: 2, color: COLORS.textPrimary },
  boardDivider: { height: 1, width: '80%', backgroundColor: COLORS.border, marginVertical: 6 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.md },
  tcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  tcCard: { flex: 1, minWidth: 80, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center' },
  tcCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainer },
  tcIcon: { fontSize: 18, marginBottom: 4 },
  tcLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '800' },
  tcLabelActive: { color: COLORS.textPrimary },
  tcSub: { color: COLORS.textFaint, fontSize: 10, fontWeight: '600' },
  playBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xl },
  playBtnText: { color: COLORS.onPrimary, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  stats: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statItem: { alignItems: 'center' },
  statVal: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800' },
  statKey: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
});
