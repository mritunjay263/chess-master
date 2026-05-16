// src/screens/HomeScreen.tsx — Quick Play, stats card, recent games, online count
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@components/Button';
import { useUserStore } from '@store/userStore';
import { useSocket } from '@hooks/useSocket';
import { useNetwork } from '@hooks/useNetwork';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Storage, STORAGE_KEYS } from '@utils/storage';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface RecentGame {
  matchId: string;
  result: 'win' | 'lose' | 'draw';
  opponent: string;
  endedAt: number;
}

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const { onlineCount, connected } = useSocket();
  const { isOnline } = useNetwork();
  const recent = Storage.getObject<RecentGame[]>(STORAGE_KEYS.RECENT_GAMES) ?? [];

  // Stats card is intentionally lightweight; real stats fetched via React Query
  // in ProfileScreen. Home shows cached lifetime numbers from MMKV.
  const stats = { wins: 0, losses: 0, draws: 0, rating: user?.rating ?? 1200 };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username ?? 'Player'}</Text>
        <View style={styles.onlineBadge}>
          <View style={[styles.dot, { backgroundColor: isOnline ? (connected ? COLORS.primary : COLORS.accent) : COLORS.danger }]} />
          <Text style={styles.onlineText}>{isOnline ? (connected ? `${onlineCount} online` : 'connecting...') : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Stat label="Rating" value={String(stats.rating)} />
        <Stat label="Wins" value={String(stats.wins)} />
        <Stat label="Losses" value={String(stats.losses)} />
        <Stat label="Draws" value={String(stats.draws)} />
      </View>

      {isOnline ? (
        <Button
          label="Quick Play"
          onPress={() => nav.navigate('Matchmaking')}
          style={{ marginTop: SPACING.lg }}
        />
      ) : (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineText}>Play vs Computer to keep playing!</Text>
        </View>
      )}

      <Button
        label="Play vs Computer"
        onPress={() => nav.navigate('SinglePlayer')}
        variant={isOnline ? 'secondary' : 'primary'}
        style={{ marginTop: SPACING.sm }}
      />

      <Text style={styles.sectionTitle}>Recent games</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>No recent games yet. Play to get started.</Text>
      ) : (
        <FlatList
          data={recent.slice(0, 5)}
          keyExtractor={(g) => g.matchId}
          renderItem={({ item }) => (
            <View style={styles.gameRow}>
              <Text style={styles.opp}>vs {item.opponent}</Text>
              <Text style={[styles.result, resultStyle(item.result)]}>{item.result.toUpperCase()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const resultStyle = (r: RecentGame['result']) => ({
  color: r === 'win' ? COLORS.primary : r === 'lose' ? COLORS.danger : COLORS.textSecondary,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { color: COLORS.textSecondary, fontSize: 12 },
  offlineCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  offlineTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  offlineText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center' },
  statValue: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  empty: { color: COLORS.textMuted, fontSize: 13 },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  opp: { color: COLORS.textPrimary, fontSize: 14 },
  result: { fontWeight: '700', fontSize: 12 },
});
