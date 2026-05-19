// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { AuthScreen } from '../screens/Auth/AuthScreen';
import { GameScreen } from '../screens/Game/GameScreen';
import { PostGameScreen } from '../screens/PostGame/PostGameScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DARK_THEME = {
  dark: true,
  colors: { primary:'#E8E8E8', background:'#0A0A0A', card:'#111', text:'#FFF', border:'#222', notification:'#FFF' },
  fonts: {
    regular: { fontFamily:'System', fontWeight:'400' as const },
    medium:  { fontFamily:'System', fontWeight:'500' as const },
    bold:    { fontFamily:'System', fontWeight:'700' as const },
    heavy:   { fontFamily:'System', fontWeight:'800' as const },
  },
};

export function RootNavigator() {
  const { user } = useUserStore();
  return (
    <NavigationContainer theme={DARK_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        {!user ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen}/>
            <Stack.Screen name="Auth" component={AuthScreen}/>
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs}/>
            <Stack.Screen name="Matchmaking" getComponent={() => require('../screens/Matchmaking/MatchmakingScreen').MatchmakingScreen}/>
            <Stack.Screen name="Game" component={GameScreen}/>
            <Stack.Screen name="PostGame" component={PostGameScreen}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
