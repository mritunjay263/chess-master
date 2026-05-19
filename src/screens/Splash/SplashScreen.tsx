// src/screens/Splash/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Auth'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.c}>
      <Text style={s.logo}>♟</Text>
      <Text style={s.title}>Chess</Text>
      <ActivityIndicator color="#888" style={{ marginTop: 40 }}/>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#0A0A0A', justifyContent:'center', alignItems:'center' },
  logo: { fontSize:80, color:'#FFF' },
  title: { fontSize:28, fontWeight:'700', color:'#FFF', letterSpacing:6, marginTop:8 },
});
