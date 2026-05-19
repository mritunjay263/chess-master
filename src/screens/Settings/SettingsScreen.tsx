// src/screens/Settings/SettingsScreen.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import type { AppSettings } from '../../types';

const TOGGLES: [string, keyof AppSettings][] = [
  ['Sound', 'soundEnabled'],
  ['Haptics', 'hapticsEnabled'],
  ['Show Legal Moves', 'showLegalMoves'],
  ['Highlight Last Move', 'showLastMove'],
];

export function SettingsScreen() {
  const { settings, updateSetting } = useSettingsStore();
  return (
    <SafeAreaView style={s.c}>
      <ScrollView contentContainerStyle={{ padding:24 }}>
        <Text style={s.title}>Settings</Text>
        {TOGGLES.map(([label, key]) => (
          <View key={key} style={s.row}>
            <Text style={s.label}>{label}</Text>
            <Switch
              value={Boolean(settings[key])}
              onValueChange={v => updateSetting(key, v as any)}
              trackColor={{ false:'#333', true:'#888' }}
              thumbColor="#FFF"
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A' },
  title: { fontSize:24, fontWeight:'800', color:'#FFF', marginBottom:32 },
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#1A1A1A' },
  label: { fontSize:16, color:'#FFF' },
});
