import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { HomeScreen } from '@screens/HomeScreen';
import { LearnScreen } from '@screens/LearnScreen';
import { LeaderboardScreen } from '@screens/LeaderboardScreen';
import { COLORS } from '@/constants/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = (label: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text
      style={{
        fontSize: 22,
        color: focused ? COLORS.secondary : COLORS.outlineVariant,
      }}
    >
      {label}
    </Text>
  );

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent', elevation: 0 },
      headerTitleStyle: {
        color: COLORS.textPrimary, fontFamily: 'Georgia', fontSize: 20,
        fontWeight: '600' as const, letterSpacing: -0.5,
      },
      tabBarStyle: {
        backgroundColor: COLORS.surfaceContainer,
        borderTopColor: 'rgba(68,71,77,0.15)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: COLORS.secondary,
      tabBarInactiveTintColor: COLORS.outlineVariant,
      tabBarLabelStyle: {
        fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5,
        textTransform: 'uppercase',
      },
    }}
  >
    <Tab.Screen
      name="Play"
      component={HomeScreen}
      options={{
        title: 'GRANDMASTER',
        tabBarIcon: TabIcon('♟'),
      }}
    />
    <Tab.Screen
      name="Learn"
      component={LearnScreen}
      options={{
        title: 'Learn',
        headerTitle: 'GRANDMASTER',
        tabBarIcon: TabIcon('📚'),
      }}
    />
    <Tab.Screen
      name="Leaderboard"
      component={LeaderboardScreen}
      options={{
        title: 'Stats',
        headerTitle: 'GRANDMASTER',
        tabBarIcon: TabIcon('📊'),
      }}
    />
  </Tab.Navigator>
);
