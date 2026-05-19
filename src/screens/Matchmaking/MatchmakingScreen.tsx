// src/screens/Matchmaking/MatchmakingScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import type { RootStackParamList } from '../../types';

export function MatchmakingScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { emit } = useSocket();
  const { matchId } = useGameStore();
  const [searching, setSearching] = useState(false);

  // Navigate to game when match is found
  useEffect(() => {
    if (matchId) nav.navigate('Game', { matchId });
  }, [matchId]);

  const startSearch = () => {
    setSearching(true);
    emit('find_match', { timeControl: { initial: 5, increment: 3 } });
  };

  const cancel = () => {
    setSearching(false);
    emit('cancel_match');
    nav.goBack();
  };

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.title}>Find a Game</Text>
      {searching ? (
        <>
          <ActivityIndicator size="large" color="#FFF" style={{ marginBottom:24 }}/>
          <Text style={s.sub}>Searching for opponent...</Text>
          <TouchableOpacity style={s.cancel} onPress={cancel}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={s.btn} onPress={startSearch}>
          <Text style={s.btnTxt}>▶ Find Match</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A', justifyContent:'center', alignItems:'center', padding:24 },
  title: { fontSize:28, fontWeight:'800', color:'#FFF', marginBottom:40 },
  sub: { fontSize:16, color:'#888', marginBottom:32 },
  btn: { backgroundColor:'#E8E8E8', borderRadius:14, paddingVertical:18, paddingHorizontal:48 },
  btnTxt: { fontSize:18, fontWeight:'800', color:'#000' },
  cancel: { marginTop:16, padding:12 },
  cancelTxt: { color:'#888', fontSize:16 },
});
