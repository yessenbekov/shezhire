import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SkeletonCard() {
  const { C } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[s.card, { backgroundColor: C.surface, borderColor: C.border, opacity }]}>
      <View style={[s.accent, { backgroundColor: C.gold + '33' }]} />
      <View style={s.body}>
        <View style={[s.line, s.lineTitle, { backgroundColor: C.border }]} />
        <View style={[s.line, s.lineSub,  { backgroundColor: C.border }]} />
        <View style={[s.line, s.lineMin,  { backgroundColor: C.border }]} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 14, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  accent: { width: 4, minHeight: 80 },
  body: { flex: 1, padding: 16, gap: 10 },
  line: { borderRadius: 7 },
  lineTitle: { height: 15, width: '55%' },
  lineSub:  { height: 11, width: '38%' },
  lineMin:  { height: 11, width: '45%' },
});
