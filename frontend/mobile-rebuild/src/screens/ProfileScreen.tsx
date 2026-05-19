// src/screens/ProfileScreen.tsx — avatar, stats, infinite-scroll history (via React Query)
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { GameApi } from '@api/client';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

export const ProfileScreen: React.FC = () => {
  const user = useUserStore((s) => s.user);

  const statsQuery = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: () => GameApi.stats(user!.id).then((r) => r.data),
    enabled: !!user && !user.isGuest,
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ['history', user?.id],
    enabled: !!user && !user.isGuest,
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      GameApi.history(user!.id, pageParam as number).then((r) => r.data),
    getNextPageParam: (last, all) => (Array.isArray(last) && last.length === 20 ? all.length + 1 : undefined),
  });

  if (!user) return null;

  const games = historyQuery.data?.pages.flatMap((p) => p) ?? [];
  const stats = statsQuery.data;
  const total = (stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.draws ?? 0);
  const winPct = total > 0 ? Math.round(((stats?.wins ?? 0) / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.username[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.rating}>Rating: {user.rating}</Text>
        {user.isGuest && <Text style={styles.guest}>Guest account</Text>}
      </View>

      <View style={styles.statsRow}>
        <Stat label="Win %" value={`${winPct}%`} />
        <Stat label="Wins" value={String(stats?.wins ?? 0)} />
        <Stat label="Losses" value={String(stats?.losses ?? 0)} />
        <Stat label="Draws" value={String(stats?.draws ?? 0)} />
      </View>
      <View style={styles.statsRow}>
        <Stat
          label="Avg length"
          value={
            stats?.avgGameLengthMs
              ? `${Math.round(stats.avgGameLengthMs / 1000 / 60)}m`
              : '—'
          }
        />
        <Stat label="Favorite opening" value={stats?.favouriteOpening ?? '—'} />
      </View>

      <Text style={styles.section}>Game history</Text>
      {historyQuery.isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(g, i) => `${g.matchId ?? i}`}
          onEndReached={() => historyQuery.hasNextPage && historyQuery.fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <View style={styles.gameRow}>
              <Text style={styles.gameOpp}>vs {item.opponent ?? 'unknown'}</Text>
              <Text style={styles.gameResult}>{(item.result ?? '').toUpperCase()}</Text>
            </View>
          )}
          ListFooterComponent={
            historyQuery.isFetchingNextPage ? <ActivityIndicator color={COLORS.primary} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '800' },
  username: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 8 },
  rating: { color: COLORS.textSecondary, marginTop: 4 },
  guest: { color: COLORS.accent, fontSize: 12, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: 11 },
  section: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  gameOpp: { color: COLORS.textPrimary },
  gameResult: { color: COLORS.textSecondary, fontWeight: '700' },
});
