// App.tsx — Root entry point
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SocketProvider } from './src/hooks/useSocket';
import { preloadSounds } from './src/utils/soundManager';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    preloadSounds().catch(console.warn);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <RootNavigator />
        </SocketProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0a0a0a' } });
