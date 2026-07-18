import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const AMBER = '#B8740A';
const TEXT_SUB = '#8B5A2A';

interface Props { onComplete: () => void }

type IconType = 'tree' | 'horseshoe' | 'chart';

const PAGES: { icon: IconType; title: string; subtitle: string }[] = [
  {
    icon: 'tree',
    title: 'ШЕЖІРЕ',
    subtitle: 'Жылқы тұқымын қадағалаудың\nең оңай жолы',
  },
  {
    icon: 'horseshoe',
    title: 'ҮЙІРЛЕР',
    subtitle: 'Жылқыларды үйірге бөліп,\nтарихын жүйелі сақтаңыз',
  },
  {
    icon: 'chart',
    title: 'ЕСЕПТЕР',
    subtitle: 'Шежіре ағашын қараңыз\nжәне толық есептер жасаңыз',
  },
];

function PageIcon({ type }: { type: IconType }) {
  if (type === 'tree') {
    return (
      <Svg width={88} height={88} viewBox="0 0 24 24">
        <Path d="M12 22 L12 14" stroke={AMBER} strokeWidth="2" strokeLinecap="round" />
        <Path d="M12 14 L7 9 M12 14 L17 9" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M7 9 L4.5 5.5 M7 9 L9.5 5.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
        <Path d="M17 9 L14.5 5.5 M17 9 L19.5 5.5" stroke={AMBER} strokeWidth="1.4" strokeLinecap="round" />
        <Circle cx="12"   cy="22"  r="1.6" fill={AMBER} />
        <Circle cx="12"   cy="14"  r="2.1" fill={AMBER} />
        <Circle cx="7"    cy="9"   r="1.8" fill={AMBER} />
        <Circle cx="17"   cy="9"   r="1.8" fill={AMBER} />
        <Circle cx="4.5"  cy="5.5" r="1.9" fill={AMBER} />
        <Circle cx="9.5"  cy="5.5" r="1.9" fill={AMBER} />
        <Circle cx="14.5" cy="5.5" r="1.9" fill={AMBER} />
        <Circle cx="19.5" cy="5.5" r="1.9" fill={AMBER} />
      </Svg>
    );
  }
  if (type === 'horseshoe') {
    return (
      <Svg width={88} height={88} viewBox="0 0 24 24" fill="none">
        <Path d="M5 20 L5 10 C5 6.1 8.1 3 12 3 C15.9 3 19 6.1 19 10 L19 20"
          stroke={AMBER} strokeWidth="3.2" strokeLinecap="round" />
        <Circle cx="5"  cy="20" r="1.8" fill={AMBER} />
        <Circle cx="19" cy="20" r="1.8" fill={AMBER} />
        <Circle cx="5"  cy="14" r="1.1" fill={AMBER} opacity={0.5} />
        <Circle cx="19" cy="14" r="1.1" fill={AMBER} opacity={0.5} />
      </Svg>
    );
  }
  // chart
  return (
    <Svg width={88} height={88} viewBox="0 0 24 24" fill="none">
      <Path d="M5 20 L5 15"  stroke={AMBER} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M12 20 L12 9" stroke={AMBER} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M19 20 L19 4" stroke={AMBER} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M3 20 L21 20" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const isLast = page === PAGES.length - 1;

  async function finish() {
    await AsyncStorage.setItem('@shezhire/onboarded', '1');
    onComplete();
  }

  function next() {
    if (!isLast) {
      scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
      setPage(page + 1);
    } else {
      finish();
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, i) => (
          <View key={i} style={[s.page, { width }]}>
            <View style={s.iconWrap}>
              <PageIcon type={p.icon} />
            </View>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.sub}>{p.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <View style={s.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[s.dot, page === i && s.dotActive]} />
          ))}
        </View>
        <View style={s.btnRow}>
          {!isLast ? (
            <TouchableOpacity onPress={finish} style={s.skipBtn}>
              <Text style={s.skipText}>Өткізу</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}
          <TouchableOpacity onPress={next} style={s.nextBtn} activeOpacity={0.85}>
            <Text style={s.nextText}>{isLast ? 'Бастайық!' : 'Келесі  ›'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF5E8' },

  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 164, height: 164, borderRadius: 82,
    backgroundColor: '#C8922A14', borderWidth: 1.5, borderColor: '#C8922A2A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 44,
  },
  title: {
    fontSize: 32, fontWeight: '800', color: AMBER, letterSpacing: 5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 18, textAlign: 'center',
  },
  sub: {
    fontSize: 17, color: TEXT_SUB, textAlign: 'center', lineHeight: 28,
  },

  bottom: { paddingHorizontal: 28, paddingTop: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 26 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E4CEAA', marginHorizontal: 4 },
  dotActive: { backgroundColor: AMBER, width: 22, borderRadius: 3.5 },

  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipBtn: { padding: 14 },
  skipText: { color: TEXT_SUB, fontSize: 16, fontWeight: '500' },
  nextBtn: {
    backgroundColor: AMBER, paddingVertical: 15, paddingHorizontal: 30,
    borderRadius: 16,
    shadowColor: AMBER, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  nextText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
