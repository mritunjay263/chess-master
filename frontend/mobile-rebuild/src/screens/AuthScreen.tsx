// src/screens/AuthScreen.tsx — minimal B&W auth
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, Pressable, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '@store/userStore';
import { AuthApi } from '@api/client';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;
type Mode = 'signin' | 'register' | 'guest';

export const AuthScreen: React.FC = () => {
  const nav        = useNavigation<Nav>();
  const setUser    = useUserStore((s) => s.setUser);
  const loginGuest = useUserStore((s) => s.loginGuest);

  const [mode,     setMode]     = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const goMain = () => nav.reset({ index: 0, routes: [{ name: 'Main' }] });

  const handleSubmit = async () => {
    if (mode === 'guest') {
      if (!username.trim()) {
        Alert.alert('Username required', 'Enter a nickname to play as guest.');
        return;
      }
      loginGuest(username.trim());
      goMain();
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = mode === 'signin'
        ? await AuthApi.login(email.trim(), password)
        : await AuthApi.register(email.trim(), password, username.trim());
      setUser(res.data.user, res.data.token);
      goMain();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const TABS: { key: Mode; label: string }[] = [
    { key: 'signin',   label: 'Sign In'  },
    { key: 'register', label: 'Register' },
    { key: 'guest',    label: 'Guest'    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.crown}>♚</Text>
        <Text style={styles.title}>CHESS</Text>
        <Text style={styles.sub}>STRATEGIC EXCELLENCE</Text>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {TABS.map(t => (
              <Pressable key={t.key} onPress={() => setMode(t.key)} style={styles.tab}>
                <Text style={[styles.tabText, mode === t.key && styles.tabActive]}>
                  {t.label}
                </Text>
                {mode === t.key && <View style={styles.tabBar} />}
              </Pressable>
            ))}
          </View>

          {(mode === 'signin' || mode === 'register') && (
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textFaint}
                value={email} onChangeText={setEmail}
                autoCapitalize="none" keyboardType="email-address"
              />
            </View>
          )}

          {(mode === 'register' || mode === 'guest') && (
            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={COLORS.textFaint}
                value={username} onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          {(mode === 'signin' || mode === 'register') && (
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textFaint}
                value={password} onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? 'Please wait…'
                : mode === 'signin'   ? 'Sign In'
                : mode === 'register' ? 'Create Account'
                : 'Play as Guest'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  crown: { fontSize: 64, color: COLORS.textPrimary, marginBottom: 8 },
  title: { color: COLORS.textPrimary, fontSize: 34, fontWeight: '900', letterSpacing: 6 },
  sub:   { color: COLORS.textSecondary, fontSize: 10, letterSpacing: 4, marginBottom: SPACING.xl, fontWeight: '600' },

  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  tabs: { flexDirection: 'row', marginBottom: SPACING.lg },
  tab:  { flex: 1, alignItems: 'center', paddingBottom: SPACING.sm },
  tabText: { color: COLORS.textFaint, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  tabActive: { color: COLORS.textPrimary },
  tabBar: { height: 2, width: '60%', backgroundColor: COLORS.textPrimary, marginTop: 4, borderRadius: 1 },

  field: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceAlt, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: 15,
  },

  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm,
  },
  btnText: { color: COLORS.onPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
