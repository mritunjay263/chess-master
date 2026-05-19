// App.tsx
// FIX: preloadSounds() called here on mount so audio is ready before any game screen
import 'react-native-gesture-handler'; // must be FIRST import
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { preloadSounds, unloadSounds } from './src/utils/soundManager';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

export default function App() {
  useEffect(() => {
    // FIX: preload all sound effects at app startup
    preloadSounds().catch(e => console.warn('[App] preloadSounds error:', e));
    return () => {
      // cleanup when app unmounts (e.g. dev reload)
      unloadSounds().catch(() => {});
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
