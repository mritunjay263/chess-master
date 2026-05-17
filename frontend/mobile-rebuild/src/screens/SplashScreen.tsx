// src/screens/SplashScreen.tsx — auto-routes to Auth or Main after auth check
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useUserStore } from '@store/userStore';
import { COLORS } from '@/constants/theme';
import { soundManager } from '@utils/soundManager';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    // Preload audio in the background — don't block navigation.
    soundManager.preload().catch(() => {});
    const id = setTimeout(() => {
      nav.reset({ index: 0, routes: [{ name: user ? 'Main' : 'Auth' }] });
    }, 900);
    return () => clearTimeout(id);
  }, [nav, scale, user]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, style]}>
        <Text style={styles.crown}>♚</Text>
      </Animated.View>
      <Text style={styles.title}>ChessMate</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: { fontSize: 72, color: COLORS.primary },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 24, letterSpacing: 2 },
});
