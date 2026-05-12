// src/screens/AuthScreen.tsx — guest + email/password auth
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@components/Button';
import { useUserStore } from '@store/userStore';
import { AuthApi } from '@api/client';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const setUser = useUserStore((s) => s.setUser);
  const loginGuest = useUserStore((s) => s.loginGuest);

  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goMain = () => nav.reset({ index: 0, routes: [{ name: 'Main' }] });

  const handleGuest = () => {
    if (!username.trim()) {
      Alert.alert('Pick a username', 'A short nickname is required for guest play.');
      return;
    }
    loginGuest(username.trim());
    goMain();
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await AuthApi.login(email, password)
          : await AuthApi.register(email, password, username);
      setUser(res.data.user, res.data.token);
      goMain();
    } catch (e: any) {
      Alert.alert('Auth failed', e?.response?.data?.message ?? e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Welcome to ChessMate</Text>

      <View style={styles.tabs}>
        {(['guest', 'login', 'register'] as const).map((m) => (
          <Text
            key={m}
            onPress={() => setMode(m)}
            style={[styles.tab, mode === m && styles.tabActive]}
          >
            {m === 'guest' ? 'Guest' : m === 'login' ? 'Log In' : 'Sign Up'}
          </Text>
        ))}
      </View>

      {(mode === 'guest' || mode === 'register') && (
        <TextInput
          placeholder="Username"
          placeholderTextColor={COLORS.textMuted}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
      )}
      {(mode === 'login' || mode === 'register') && (
        <>
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </>
      )}

      {mode === 'guest' ? (
        <Button label="Play as Guest" onPress={handleGuest} />
      ) : (
        <Button label={mode === 'login' ? 'Log In' : 'Sign Up'} onPress={handleAuth} loading={loading} />
      )}

      <Text style={styles.oauth}>Google sign-in coming soon</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'center' },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.lg },
  tabs: { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.lg, gap: SPACING.md },
  tab: { color: COLORS.textMuted, paddingVertical: 6, paddingHorizontal: 12, fontWeight: '600' },
  tabActive: { color: COLORS.primary, borderBottomWidth: 2, borderColor: COLORS.primary },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: 15,
  },
  oauth: { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.lg, fontSize: 12 },
});
