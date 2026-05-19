// src/screens/PostGame/PostGameScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChessGame } from '../../hooks/useChessGame';
import { useGameStore } from '../../store/gameStore';
import type { RootStackParamList } from '../../types';

export function PostGameScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { result } = route.params ?? {};
  const { requestRematch } = useChessGame();
  const { rematchOffered, resetGame } = useGameStore();

  const emoji = result?.winner === 'draw' ? '🤝' : result?.winner ? '♟' : '⚑';
  const headline = result?.winner === 'draw' ? 'Draw' : result?.winner ? 'Victory' : 'Defeated';
  const reason = (result?.reason ?? '').replace(/_/g, ' ');

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.headline}>{headline}</Text>
      <Text style={s.reason}>{reason}</Text>
      <TouchableOpacity style={s.btn} onPress={requestRematch} disabled={rematchOffered}>
        <Text style={s.btnTxt}>{rematchOffered ? '⏳ Waiting...' : '↺ Rematch'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.ghost} onPress={() => { resetGame(); nav.navigate('Main'); }}>
        <Text style={s.ghostTxt}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A', justifyContent:'center', alignItems:'center', padding:24 },
  emoji: { fontSize:72, marginBottom:16 },
  headline: { fontSize:32, fontWeight:'800', color:'#FFF' },
  reason: { color:'#888', marginBottom:40, textTransform:'capitalize', marginTop:4 },
  btn: { backgroundColor:'#E8E8E8', borderRadius:14, paddingVertical:16, paddingHorizontal:48, marginBottom:16 },
  btnTxt: { fontSize:18, fontWeight:'800', color:'#000' },
  ghost: { padding:12 },
  ghostTxt: { color:'#666', fontSize:16 },
});
