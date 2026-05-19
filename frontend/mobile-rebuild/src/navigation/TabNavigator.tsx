import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@screens/HomeScreen';
import { COLORS } from '@/constants/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent', elevation: 0 },
      headerTitleStyle: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        height: 58,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: COLORS.textPrimary,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
      },
    }}
  >
    <Tab.Screen
      name="Play"
      component={HomeScreen}
      options={{
        title: 'Chess',
        tabBarLabel: 'Play',
      }}
    />
  </Tab.Navigator>
);
