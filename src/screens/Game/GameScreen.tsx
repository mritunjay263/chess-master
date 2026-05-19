// src/screens/Game/GameScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChessBoard } from '../../components/Board/ChessBoard';
import { PromotionSheet } from '../../components/Promotion/PromotionSheet';
import { TimerDisplay } from '../../components/Timer/TimerDisplay';
import { CapturedRow } from '../../components/CapturedRow/CapturedRow';
import { useChessGame } from '../../hooks/useChessGame';
import { useTimer } from '../../hooks/useTimer';
import { useGameStore } from '../../store/gameStore';
import type { RootStackParamList } from '../../types';

export function GameScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { myColor, alert, handleSquarePress, handlePromotion, resign, offerDraw } = useChessGame();
  const { whiteTime, blackTime } = useTimer(myColor);
  const { pendingPromotion, white, black, status, result, moves, turn, drawOfferedBy, setDrawOffered } = useGameStore();

  useEffect(() => {
    if (status === 'finished' && result) {
      nav.replace('PostGame', { matchId: useGameStore.getState().matchId!, result });
    }
  }, [status]);

  const opponent = myColor === 'w' ? black : white;
  const me = myColor === 'w' ? white : black;
  const opponentTime = myColor === 'w' ? blackTime : whiteTime;
  const myTime = myColor === 'w' ? whiteTime : blackTime;
  const opponentColor = myColor === 'w' ? 'b' : 'w';
  const opponentActive = turn !== myColor;
  const meActive = turn === myColor;

  return (
    <SafeAreaView style={s.c}>
      {/* Opponent row */}
      <View style={s.playerRow}>
        <View>
          <Text style={s.name}>{opponent?.username ?? 'Opponent'}</Text>
          <CapturedRow moves={moves} capturedBy={myColor}/>
        </View>
        <TimerDisplay ms={opponentTime} color={opponentColor} active={opponentActive}/>
      </View>

      {/* Alert banner */}
      {alert && (
        <View style={s.banner}>
          <Text style={s.bannerTxt}>{alert.toUpperCase()}</Text>
        </View>
      )}

      {/* Draw offer banner */}
      {drawOfferedBy && drawOfferedBy !== myColor && (
        <View style={s.drawBanner}>
          <Text style={s.drawTxt}>Opponent offers a draw</Text>
          <View style={s.drawBtns}>
            <TouchableOpacity style={s.accept} onPress={() => { useGameStore.getState().acceptDraw?.(); }}>
              <Text style={s.acceptTxt}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.decline} onPress={() => setDrawOffered(null)}>
              <Text style={s.declineTxt}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Board */}
      <ChessBoard onSquarePress={handleSquarePress}/>

      {/* My row */}
      <View style={s.playerRow}>
        <View>
          <Text style={s.name}>{me?.username ?? 'You'}</Text>
          <CapturedRow moves={moves} capturedBy={opponentColor}/>
        </View>
        <TimerDisplay ms={myTime} color={myColor} active={meActive}/>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.actBtn} onPress={offerDraw}>
          <Text style={s.actTxt}>½ Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actBtn, s.resign]}
          onPress={() => Alert.alert('Resign?', 'Are you sure you want to resign?', [
            { text:'Cancel', style:'cancel' },
            { text:'Resign', style:'destructive', onPress: resign },
          ])}>
          <Text style={s.actTxt}>⚑ Resign</Text>
        </TouchableOpacity>
      </View>

      {/* Promotion sheet — BUG-4 */}
      <PromotionSheet visible={!!pendingPromotion} color={myColor} onSelect={handlePromotion}/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A', justifyContent:'space-between', paddingVertical:8, paddingHorizontal:16 },
  playerRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:6 },
  name: { fontSize:15, fontWeight:'700', color:'#FFF', marginBottom:2 },
  banner: { backgroundColor:'#1E1E1E', borderRadius:8, padding:8, alignItems:'center', marginVertical:4 },
  bannerTxt: { color:'#FFC107', fontWeight:'800', fontSize:13, letterSpacing:2 },
  drawBanner: { backgroundColor:'#1A2A1A', borderRadius:10, padding:12, marginVertical:4 },
  drawTxt: { color:'#6DBF67', fontWeight:'600', fontSize:14, marginBottom:8 },
  drawBtns: { flexDirection:'row', gap:8 },
  accept: { flex:1, backgroundColor:'#2A4A2A', borderRadius:8, padding:10, alignItems:'center' },
  acceptTxt: { color:'#6DBF67', fontWeight:'700' },
  decline: { flex:1, backgroundColor:'#2A2A2A', borderRadius:8, padding:10, alignItems:'center' },
  declineTxt: { color:'#888', fontWeight:'700' },
  actions: { flexDirection:'row', gap:12, justifyContent:'flex-end', marginTop:4, marginBottom:8 },
  actBtn: { backgroundColor:'#1C1C1C', borderRadius:10, paddingVertical:10, paddingHorizontal:18, borderWidth:1, borderColor:'#333' },
  resign: { borderColor:'#555' },
  actTxt: { color:'#FFF', fontSize:14, fontWeight:'600' },
});
