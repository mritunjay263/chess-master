// src/screens/Profile/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useUserStore } from '../../store/userStore';

export function ProfileScreen() {
  const { user, logout } = useUserStore();
  const stats = [['Wins', user?.wins], ['Losses', user?.losses], ['Draws', user?.draws]];

  return (
    <SafeAreaView style={s.c}>
      <ScrollView contentContainerStyle={s.sc}>
        <Text style={s.avatar}>◉</Text>
        <Text style={s.name}>{user?.username}</Text>
        <Text style={s.rating}>{user?.rating ?? 1200}</Text>
        <View style={s.row}>
          {stats.map(([k, v]) => (
            <View key={String(k)} style={s.stat}>
              <Text style={s.statVal}>{v ?? 0}</Text>
              <Text style={s.statLbl}>{k}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.logout} onPress={logout}>
          <Text style={s.logoutTxt}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A' },
  sc: { padding:24, alignItems:'center' },
  avatar: { fontSize:64, color:'#FFF', marginTop:32 },
  name: { fontSize:24, fontWeight:'800', color:'#FFF', marginTop:8 },
  rating: { fontSize:48, fontWeight:'800', color:'#FFF', marginVertical:8 },
  row: { flexDirection:'row', gap:32, marginTop:24, marginBottom:48 },
  stat: { alignItems:'center' },
  statVal: { fontSize:22, fontWeight:'700', color:'#FFF' },
  statLbl: { fontSize:12, color:'#666', marginTop:4 },
  logout: { padding:14 },
  logoutTxt: { color:'#F44336', fontSize:16, fontWeight:'600' },
});
