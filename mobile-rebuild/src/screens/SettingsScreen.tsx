// src/screens/SettingsScreen.tsx — toggles persisted via MMKV (settingsStore)
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useUserStore } from '@store/userStore';
import { useSettingsStore } from '@store/settingsStore';
import { Button } from '@components/Button';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { BoardThemeKey, PieceThemeKey } from '@/types/index';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const BOARD_OPTIONS: { key: BoardThemeKey; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'green', label: 'Green' },
  { key: 'blue', label: 'Blue' },
];
const PIECE_OPTIONS: { key: PieceThemeKey; label: string }[] = [
  { key: 'merida', label: 'Merida' },
  { key: 'alpha', label: 'Alpha' },
  { key: 'neo', label: 'Neo' },
];

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const SettingsScreen: React.FC = () => {
  const s = useSettingsStore();
  const logout = useUserStore((u) => u.logout);
  const nav = useNavigation<Nav>();

  const handleLogout = () => {
    logout();
    nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      <Section title="Audio">
        <Row label="Sound" value={<Switch value={s.soundEnabled} onValueChange={s.setSoundEnabled} />} />
        <Row
          label={`Volume — ${Math.round(s.volume * 100)}%`}
          value={
            <View style={{ flexDirection: 'row' }}>
              <Button label="−" variant="ghost" onPress={() => s.setVolume(s.volume - 0.1)} />
              <View style={{ width: 6 }} />
              <Button label="+" variant="ghost" onPress={() => s.setVolume(s.volume + 0.1)} />
            </View>
          }
        />
      </Section>

      <Section title="Haptics">
        <Row label="Vibration" value={<Switch value={s.hapticsEnabled} onValueChange={s.setHapticsEnabled} />} />
      </Section>

      <Section title="Board theme">
        <View style={styles.optRow}>
          {BOARD_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => s.setBoardTheme(o.key)}
              style={[styles.chip, s.boardTheme === o.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, s.boardTheme === o.key && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Piece theme">
        <View style={styles.optRow}>
          {PIECE_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => s.setPieceTheme(o.key)}
              style={[styles.chip, s.pieceTheme === o.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, s.pieceTheme === o.key && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Gameplay">
        <Row label="Show legal moves" value={<Switch value={s.showLegalMoves} onValueChange={s.setShowLegalMoves} />} />
        <Row label="Highlight last move" value={<Switch value={s.showLastMove} onValueChange={s.setShowLastMove} />} />
      </Section>

      <Section title="Account">
        <Button label="Log out" variant="danger" onPress={handleLogout} />
      </Section>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {value}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  section: { marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.textSecondary, fontWeight: '600', marginBottom: SPACING.xs, marginLeft: SPACING.xs },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  rowLabel: { color: COLORS.textPrimary, fontSize: 14 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, padding: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceAlt,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#000' },
});
