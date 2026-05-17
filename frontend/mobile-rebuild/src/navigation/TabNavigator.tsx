// src/navigation/TabNavigator.tsx — bottom-tab navigation for the main app
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '@screens/HomeScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { COLORS } from '@/constants/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

// Tiny inline icon — replace with a real icon set in production.
const TabIcon =
  (label: string) =>
  ({ focused }: { focused: boolean }) =>
    <Text style={{ fontSize: 18, color: focused ? COLORS.primary : COLORS.textMuted }}>{label}</Text>;

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background },
      headerTitleStyle: { color: COLORS.textPrimary },
      tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: TabIcon('♟') }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: TabIcon('☻') }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: TabIcon('⚙') }} />
  </Tab.Navigator>
);
