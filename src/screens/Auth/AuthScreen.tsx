// src/screens/Auth/AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { authAPI } from '../../api/restClient';
import { useUserStore } from '../../store/userStore';

export function AuthScreen() {
  const { setUser } = useUserStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const playAsGuest = async () => {
    if (!username.trim()) { Alert.alert('Enter a username'); return; }
    setLoading(true);
    try {
      const r = await authAPI.loginGuest(username.trim());
      setUser(r.data.user, true);
    } catch {
      // Offline / demo fallback — works without a running backend
      setUser({ id: `guest_${Date.now()}`, username: username.trim(), rating: 1200, wins:0, losses:0, draws:0 }, true);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.logo}>♟</Text>
      <Text style={s.title}>Chess</Text>
      <Text style={s.sub}>Play chess on the go</Text>
      <TextInput
        style={s.input} placeholder="Username" placeholderTextColor="#555"
        value={username} onChangeText={setUsername} maxLength={20} autoCapitalize="none"
      />
      <TouchableOpacity style={s.btn} onPress={playAsGuest} disabled={loading}>
        {loading ? <ActivityIndicator color="#000"/> : <Text style={s.btnTxt}>Play as Guest</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A', justifyContent:'center', alignItems:'center', padding:24 },
  logo: { fontSize:72, color:'#FFF', marginBottom:8 },
  title: { fontSize:32, fontWeight:'800', color:'#FFF', letterSpacing:4 },
  sub: { fontSize:14, color:'#666', marginBottom:40 },
  input: { width:'100%', backgroundColor:'#1A1A1A', borderRadius:12, padding:16, fontSize:16, color:'#FFF', borderWidth:1, borderColor:'#333', marginBottom:16 },
  btn: { width:'100%', backgroundColor:'#E8E8E8', borderRadius:12, padding:16, alignItems:'center' },
  btnTxt: { fontSize:16, fontWeight:'700', color:'#000' },
});
