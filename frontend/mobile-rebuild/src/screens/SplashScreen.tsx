// src/screens/SplashScreen.tsx — B&W splash, auto-routes to Auth or Main
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@store/userStore';
import { COLORS } from '@/constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const nav  = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    const id = setTimeout(() => {
      nav.reset({ index: 0, routes: [{ name: user ? 'Main' : 'Auth' }] });
    }, 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.crown}>♚</Text>
      <Text style={styles.title}>CHESS</Text>
      <Text style={styles.sub}>PLAY · LEARN · MASTER</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  crown: { fontSize: 80, color: COLORS.textPrimary, marginBottom: 8 },
  title: {
    color: COLORS.textPrimary, fontSize: 40, fontWeight: '900',
    letterSpacing: 8,
  },
  sub: {
    color: COLORS.textSecondary, fontSize: 11, letterSpacing: 4,
    fontWeight: '600', textTransform: 'uppercase',
  },
});
