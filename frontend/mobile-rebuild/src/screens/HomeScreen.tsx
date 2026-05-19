import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@store/userStore';
import { useSocket } from '@hooks/useSocket';
import { COLORS, RADIUS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_PLAY = [
  { icon: '⚡', label: 'Blitz (3 min)', desc: 'Instant Pairings', mode: 'blitz3' as const },
  { icon: '⏱', label: 'Rapid (10 min)', desc: 'Calculated Play', mode: 'rapid' as const },
  { icon: '🏆', label: 'Tournament', desc: 'Elite Bracket', mode: 'blitz5' as const },
  { icon: '👥', label: 'Play Friend', desc: 'Private Challenge', mode: null },
];

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const { onlineCount, connected } = useSocket();

  const historyQuery = useQuery({
    queryKey: ['recent-games', user?.id],
    queryFn: async () => {
      const { GameApi } = await import('@api/client');
      const res = await GameApi.history(user!.id, 1);
      return (res.data ?? []).slice(0, 5);
    },
    enabled: !!user && !user.isGuest,
    staleTime: 30_000,
  });

  const recentGames = historyQuery.data ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? 'G'}</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Grandmaster</Text>
        <View style={styles.topBarRight}>
          <View style={styles.onlineBadge}>
            <View style={[styles.onlineDot, { backgroundColor: connected ? COLORS.secondary : COLORS.danger }]} />
            <Text style={styles.onlineText}>{connected ? `${onlineCount} on` : 'off'}</Text>
          </View>
          <Pressable style={styles.gearBtn} onPress={() => nav.navigate('Settings')}>
            <Text style={styles.gearIcon}>⚙</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero: Current Rating */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>CURRENT WORLD RANKING</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroRating}>{user?.rating ?? 1200}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Active Now</Text>
              </View>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => nav.navigate('Matchmaking')}
              >
                <Text style={styles.primaryBtnText}>New Ranked Match</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => nav.navigate('SinglePlayer')}
              >
                <Text style={styles.secondaryBtnText}>Practice Bot</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Strategic Command */}
        <Text style={styles.sectionTitle}>Strategic Command</Text>
        <View style={styles.quickGrid}>
          {QUICK_PLAY.map((item) => (
            <Pressable
              key={item.label}
              style={styles.quickTile}
              onPress={() => {
                if (item.mode) nav.navigate('Matchmaking', { timeControlKey: item.mode });
              }}
            >
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
              <Text style={styles.quickDesc}>{item.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Encounters */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Encounters</Text>
          <Pressable onPress={() => user && nav.navigate('Profile', { userId: user.id })}>
            <Text style={styles.viewHistory}>View All</Text>
          </Pressable>
        </View>
        {recentGames.length === 0 && historyQuery.isFetched && (
          <Text style={styles.emptyText}>No recent games. Start playing!</Text>
        )}
        {historyQuery.isLoading && (
          <Text style={styles.emptyText}>Loading recent games...</Text>
        )}
        {recentGames.map((game: any, i: number) => (
          <View key={game.matchId ?? i} style={styles.matchCard}>
            <View style={styles.matchLeft}>
              <View style={styles.matchAvatars}>
                <View style={styles.matchAvatar}>
                  <Text style={styles.matchAvatarText}>
                    {(game.opponent?.username ?? '?')[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.matchVS}>
                  <Text style={styles.matchVSText}>VS</Text>
                </View>
              </View>
              <View>
              <Text style={styles.matchName}>vs {game.opponent?.username ?? 'Unknown'}</Text>
              <Text style={styles.matchDesc}>
                {(game.result ?? '').toUpperCase()}
                {game.opening ? ` • ${game.opening}` : ''}
              </Text>
              </View>
            </View>
            <View style={styles.matchRight}>
              <Text style={[
                styles.matchElo,
                game.result === 'win' && styles.matchEloWin,
                game.result === 'lose' && styles.matchEloLose,
              ]}>
                {game.eloChange ?? 0 > 0 ? '+' : ''}{game.eloChange ?? '—'}
              </Text>
              <Text style={styles.matchTime}>
                {game.endedAt ? new Date(game.endedAt).toLocaleDateString() : ''}
              </Text>
            </View>
          </View>
        ))}

        {!user || user.isGuest ? (
          <View style={styles.guestPrompt}>
            <Text style={styles.guestPromptText}>
              Sign in to track your games and stats.
            </Text>
            <Pressable
              style={styles.guestPromptBtn}
              onPress={() => nav.reset({ index: 0, routes: [{ name: 'Auth' }] })}
            >
              <Text style={styles.guestPromptBtnText}>Sign In</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(68,71,77,0.15)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.2)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  avatarText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  topBarTitle: {
    fontFamily: 'Georgia', fontSize: 20, fontWeight: '600',
    color: COLORS.textPrimary, letterSpacing: -0.5,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { color: COLORS.outline, fontSize: 11, fontWeight: '500' },
  gearBtn: { padding: 4 },
  gearIcon: { fontSize: 20, color: COLORS.textPrimary },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },

  heroCard: {
    marginTop: 20, marginBottom: 28,
  },
  heroContent: {
    backgroundColor: 'rgba(14,31,61,0.8)',
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
    padding: 24,
  },
  heroLabel: {
    fontSize: 11, fontWeight: '500', letterSpacing: 2,
    color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8,
  },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  heroRating: {
    fontFamily: 'Georgia', fontSize: 42, fontWeight: '600',
    color: COLORS.primary, letterSpacing: -1,
  },
  heroBadge: {
    backgroundColor: 'rgba(149,211,186,0.15)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  heroBadgeText: { color: COLORS.secondary, fontSize: 12, fontWeight: '600' },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  primaryBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  primaryBtnText: {
    color: COLORS.onSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.3)',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md,
  },
  secondaryBtnText: {
    color: COLORS.primary, fontSize: 13, fontWeight: '500', letterSpacing: 1,
    textTransform: 'uppercase',
  },

  sectionTitle: {
    fontFamily: 'Georgia', fontSize: 22, fontWeight: '500',
    color: COLORS.primary, marginBottom: 16,
  },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32,
  },
  quickTile: {
    width: '47%', backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg, padding: 20,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  quickIcon: { fontSize: 28, marginBottom: 12, color: COLORS.secondary },
  quickLabel: { color: COLORS.primary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  quickDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },

  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  viewHistory: { color: COLORS.secondary, fontSize: 12, fontWeight: '500', letterSpacing: 1 },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  matchCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  matchLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  matchAvatars: { flexDirection: 'row', alignItems: 'center' },
  matchAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.2)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceBright,
  },
  matchAvatarText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  matchVS: {
    width: 40, height: 40, borderRadius: 20, marginLeft: -10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.2)', backgroundColor: COLORS.surfaceBright,
  },
  matchVSText: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  matchName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  matchDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  matchRight: { alignItems: 'flex-end' },
  matchElo: { fontSize: 18, fontWeight: '600', color: COLORS.primary },
  matchEloWin: { color: COLORS.secondary },
  matchEloLose: { color: COLORS.danger },
  matchTime: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },

  guestPrompt: {
    marginTop: 20, padding: 20, alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  guestPromptText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  guestPromptBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  guestPromptBtnText: {
    color: COLORS.onSecondary, fontSize: 13, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
