import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@screens/SplashScreen';
import { AuthScreen } from '@screens/AuthScreen';
import { MatchmakingScreen } from '@screens/MatchmakingScreen';
import { GameScreen } from '@screens/GameScreen';
import { PostGameScreen } from '@screens/PostGameScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { TabNavigator } from './TabNavigator';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    primary: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.textPrimary,
  },
};

export const RootNavigator: React.FC = () => (
  <NavigationContainer theme={navTheme}>
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={{ title: 'Matchmaking' }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostGame" component={PostGameScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  </NavigationContainer>
);
