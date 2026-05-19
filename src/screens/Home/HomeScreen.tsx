// src/screens/Home/HomeScreen.tsx
import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../../store/userStore';
import type { RootStackParamList } from '../../types';

const TIME_CONTROLS = [{ label:'1 min' }, { label:'3 min' }, { label:'5+3' }, { label:'10 min' }];

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUserStore();
  return (
    <SafeAreaView style={s.c}>
      <ScrollView contentContainerStyle={s.sc}>
        <Text style={s.greet}>Hello, {user?.username}</Text>
        <Text style={s.rating}>Rating: {user?.rating ?? 1200}</Text>
        <Text style={s.section}>Quick Play</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:24 }}>
          {TIME_CONTROLS.map(t => (
            <TouchableOpacity key={t.label} style={s.tcBtn} onPress={() => nav.navigate('Matchmaking')}>
              <Text style={s.tcTxt}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={s.big} onPress={() => nav.navigate('Matchmaking')}>
          <Text style={s.bigTxt}>▶ Play Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A' },
  sc: { padding:20 },
  greet: { fontSize:24, fontWeight:'800', color:'#FFF', marginTop:8 },
  rating: { fontSize:14, color:'#888', marginBottom:24 },
  section: { fontSize:12, fontWeight:'700', color:'#555', letterSpacing:2, marginBottom:12, textTransform:'uppercase' },
  tcBtn: { backgroundColor:'#1C1C1C', borderRadius:12, padding:16, marginRight:12, alignItems:'center', minWidth:80, borderWidth:1, borderColor:'#2A2A2A' },
  tcTxt: { fontSize:15, fontWeight:'700', color:'#FFF' },
  big: { backgroundColor:'#E8E8E8', borderRadius:14, padding:18, alignItems:'center' },
  bigTxt: { fontSize:18, fontWeight:'800', color:'#000' },
});
