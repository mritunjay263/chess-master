// src/components/Promotion/PromotionSheet.tsx — BUG-4: blocks board until piece chosen
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChessPiece } from '../Pieces/ChessPiece';
import type { PromotionPiece, PieceColor } from '../../types';

interface Props { visible: boolean; color: PieceColor; onSelect: (p: PromotionPiece) => void; }
const OPTS: PromotionPiece[] = ['q', 'r', 'b', 'n'];

export function PromotionSheet({ visible, color, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.sheet}>
          <Text style={s.title}>Promote Pawn</Text>
          <View style={s.row}>
            {OPTS.map(p => (
              <TouchableOpacity key={p} style={s.btn} onPress={() => onSelect(p)}>
                <ChessPiece type={p} color={color} size={56}/>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'center', alignItems:'center' },
  sheet: { backgroundColor:'#1C1C1C', borderRadius:16, padding:24, alignItems:'center', width:280 },
  title: { color:'#FFF', fontSize:16, fontWeight:'700', marginBottom:16 },
  row: { flexDirection:'row', gap:8 },
  btn: { width:56, height:56, borderRadius:12, backgroundColor:'#2E2E2E', justifyContent:'center', alignItems:'center' },
});
