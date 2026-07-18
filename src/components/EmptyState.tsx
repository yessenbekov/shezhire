import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface Props {
  icon: 'herds' | 'horses' | 'search' | 'tree';
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyIcon({ type, color }: { type: Props['icon']; color: string }) {
  if (type === 'herds') {
    return (
      <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <Path d="M5 20 L5 10 C5 6.1 8.1 3 12 3 C15.9 3 19 6.1 19 10 L19 20"
          stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="5"  cy="20" r="1.5" fill={color} />
        <Circle cx="19" cy="20" r="1.5" fill={color} />
        <Circle cx="5"  cy="13" r="0.9" fill={color} opacity={0.45} />
        <Circle cx="19" cy="13" r="0.9" fill={color} opacity={0.45} />
      </Svg>
    );
  }
  if (type === 'horses') {
    return (
      <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <Path d="M5 20 L5 10 C5 6.1 8.1 3 12 3 C15.9 3 19 6.1 19 10 L19 20"
          stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="5"  cy="20" r="1.3" fill={color} />
        <Circle cx="19" cy="20" r="1.3" fill={color} />
        <Circle cx="12" cy="3"  r="1.5" fill={color} />
        <Path d="M8 20 L16 20" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.35} />
      </Svg>
    );
  }
  if (type === 'search') {
    return (
      <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
        <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
        <Path d="M16.5 16.5 L21 21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </Svg>
    );
  }
  // tree (genealogy)
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24">
      <Path d="M12 21 L12 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 14 L7 9 M12 14 L17 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 9 L4.5 5.5 M7 9 L9.5 5.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M17 9 L14.5 5.5 M17 9 L19.5 5.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Circle cx="12"   cy="21"  r="1.5" fill={color} />
      <Circle cx="12"   cy="14"  r="2"   fill={color} />
      <Circle cx="7"    cy="9"   r="1.7" fill={color} />
      <Circle cx="17"   cy="9"   r="1.7" fill={color} />
      <Circle cx="4.5"  cy="5.5" r="1.8" fill={color} />
      <Circle cx="9.5"  cy="5.5" r="1.8" fill={color} />
      <Circle cx="14.5" cy="5.5" r="1.8" fill={color} />
      <Circle cx="19.5" cy="5.5" r="1.8" fill={color} />
    </Svg>
  );
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const { C } = useTheme();

  return (
    <View style={s.wrap}>
      <View style={[s.circle, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
        <EmptyIcon type={icon} color={C.gold} />
      </View>
      <Text style={[s.title, { color: C.text }]}>{title}</Text>
      {subtitle ? <Text style={[s.sub, { color: C.muted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[s.btn, { backgroundColor: C.gold }]} onPress={onAction} activeOpacity={0.82}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60, paddingBottom: 100 },
  circle: { width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn: { paddingVertical: 13, paddingHorizontal: 30, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
