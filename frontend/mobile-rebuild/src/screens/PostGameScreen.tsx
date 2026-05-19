// src/screens/PostGameScreen.tsx — clean result screen
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useGameStore } from '@store/gameStore';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

type Nav   = NativeStackNavigationProp<RootStackParamList, 'PostGame'>;
type Route = RouteProp<RootStackParamList, 'PostGame'>;

const REASON_LABEL: Record<string, string> = {
  checkmate: 'Checkmate', resignation: 'Resignation', timeout: 'Time out',
  stalemate: 'Stalemate', draw_agreed: 'Draw agreed',
  threefold_repetition: 'Threefold repetition',
  insufficient_material: 'Insufficient material',
  fifty_move_rule: '50-move rule', opponent_left: 'Opponent left',
};

export const PostGameScreen: React.FC = () => {
  const nav   = useNavigation<Nav>();
  const route = useRoute<Route>();
  const reset = useGameStore((s) => s.resetGame);
  const { result } = route.params;

  const emoji    = result.kind === 'win' ? '🏆' : result.kind === 'lose' ? '💀' : '🤝';
  const headline = result.kind === 'win' ? 'YOU WIN' : result.kind === 'lose' ? 'YOU LOSE' : 'DRAW';
  const sub      = REASON_LABEL[result.reason] ?? result.reason;

  const handleHome = () => { reset(); nav.reset({ index: 0, routes: [{ name: 'Main' }] }); };
  const handleRematch = () => { reset(); nav.replace('Matchmaking'); };

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.headline, result.kind === 'win' && styles.win, result.kind === 'lose' && styles.lose]}>{headline}</Text>
      <Text style={styles.sub}>{sub}</Text>
      <View style={styles.btns}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnPrimary, { opacity: pressed ? 0.8 : 1 }]} onPress={handleRematch}>
          <Text style={styles.btnPrimaryText}>PLAY AGAIN</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnSecondary, { opacity: pressed ? 0.8 : 1 }]} onPress={handleHome}>
          <Text style={styles.btnSecondaryText}>HOME</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji:    { fontSize: 80, marginBottom: SPACING.md },
  headline: { fontSize: 38, fontWeight: '900', letterSpacing: 4, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  win:      { color: COLORS.success },
  lose:     { color: COLORS.danger },
  sub:      { color: COLORS.textSecondary, fontSize: 14, letterSpacing: 1, marginBottom: SPACING.xxl },
  btns:     { gap: SPACING.md, width: '100%' },
  btn:      { borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: COLORS.onPrimary, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  btnSecondary: { borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '700' },
});
