// src/components/Timer/TimerDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/chessHelpers';
import type { PieceColor } from '../../types';

interface Props { ms: number; color: PieceColor; active: boolean; }

function getTimerColor(ms: number): string {
  if (ms > 30000) return '#4CAF50';
  if (ms > 10000) return '#FFC107';
  return '#F44336';
}

export function TimerDisplay({ ms, color, active }: Props) {
  const fg = getTimerColor(ms);
  return (
    <View style={[s.box, active && s.active, { borderColor: active ? fg : '#333' }]}>
      <View style={[s.dot, { backgroundColor: color === 'w' ? '#FFF' : '#222', borderColor: color === 'w' ? '#888' : '#DDD' }]}/>
      <Text style={[s.time, { color: active ? fg : '#888' }]}>{formatTime(ms)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection:'row', alignItems:'center', paddingVertical:6, paddingHorizontal:14, borderRadius:8, borderWidth:2, borderColor:'#333', backgroundColor:'#141414', gap:8 },
  active: { backgroundColor:'#1E1E1E' },
  dot: { width:14, height:14, borderRadius:7, borderWidth:1 },
  time: { fontSize:22, fontWeight:'700', fontVariant:['tabular-nums'], minWidth:64 },
});
