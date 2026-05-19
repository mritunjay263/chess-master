// ============================================================
// src/App.tsx — Root component: wraps all providers
// ============================================================
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './navigation/RootNavigator';
import { SocketProvider } from './api/SocketContext';
import { soundManager } from './utils/soundManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

export default function App() {
  useEffect(() => {
    // Preload all sounds on app start (non-blocking)
    soundManager.preloadAll();
    return () => soundManager.unloadAll();
  }, []);

  return (
    // GestureHandlerRootView must wrap everything for Reanimated gestures
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </SocketProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
