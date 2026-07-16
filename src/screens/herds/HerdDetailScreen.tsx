import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import { getAgeName } from '../../utils/horseAge';
import type { Colors } from '../../theme';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'HerdDetail'>;
  route: RouteProp<HerdsStackParamList, 'HerdDetail'>;
};

export default function HerdDetailScreen({ navigation, route }: Props) {
  const { herdId } = route.params;
  const { C, ageNames } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C, insets.bottom), [C, insets.bottom]);

  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadHorses(); }, [herdId]));

  async function loadHorses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shezhire_horses')
      .select('*')
      .eq('herd_id', herdId)
      .order('sequence_no', { ascending: true });
    if (!error && data) setHorses(data as Horse[]);
    setLoading(false);
  }

  const stallions = horses.filter(h => h.sex === 'м');
  const mares = horses.filter(h => h.sex === 'ж');

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{horses.length}</Text>
          <Text style={styles.statLabel}>{t.herd_all}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.male }]}>{stallions.length}</Text>
          <Text style={styles.statLabel}>{t.herd_stallions}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: C.female }]}>{mares.length}</Text>
          <Text style={styles.statLabel}>{t.herd_mares}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={horses}
          keyExtractor={h => h.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🐎</Text>
              <Text style={styles.emptyTitle}>{t.herd_empty}</Text>
              <Text style={styles.emptySub}>{t.herd_emptyHint}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMale = item.sex === 'м';
            const ageName = getAgeName(item.birth_year, item.sex, ageNames);
            const isDead = (item.disposition && item.disposition !== 'alive') || !!item.died_at;
            return (
              <TouchableOpacity
                style={[styles.card, isDead && { opacity: 0.55 }]}
                onPress={() => navigation.navigate('HorseDetail', { horseId: item.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.sexStrip, { backgroundColor: isMale ? C.maleBorder : C.femaleBorder }]} />
                <View style={[styles.brandWrap, { backgroundColor: isMale ? C.maleBg : C.femaleBg }]}>
                  <Text style={[styles.brand, { color: isMale ? C.male : C.female }]}>{item.brand}</Text>
                  <Text style={[styles.sexIcon, { color: isMale ? C.male : C.female }]}>{isMale ? '♂' : '♀'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  {item.name ? <Text style={styles.horseName}>{item.name}</Text> : null}
                  <Text style={styles.ageName}>{ageName} · {item.birth_year}</Text>
                  {item.breed ? <Text style={styles.breed}>{item.breed}</Text> : null}
                  {isDead ? <Text style={styles.deadTag}>🕊 {t.disp_dead.toLowerCase()}</Text> : null}
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddHorse', { herdId })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (C: Colors, safeBottom: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  statsBar: { flexDirection: 'row', backgroundColor: C.surface, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: C.border },
  statNum: { color: C.gold, fontSize: 26, fontWeight: '800' },
  statLabel: { color: C.muted, fontSize: 12, marginTop: 3 },
  emptyWrap: { alignItems: 'center', paddingTop: 70 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySub: { color: C.faint, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sexStrip: { width: 4, alignSelf: 'stretch' },
  brandWrap: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center', minWidth: 76 },
  brand: { fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  sexIcon: { fontSize: 14, marginTop: 4 },
  cardInfo: { flex: 1, paddingVertical: 14, paddingLeft: 6 },
  horseName: { color: C.text, fontSize: 16, fontWeight: '600' },
  ageName: { color: C.muted, fontSize: 13, marginTop: 2 },
  breed: { color: C.faint, fontSize: 12, marginTop: 1 },
  deadTag: { color: '#C84A4A', fontSize: 11, marginTop: 2 },
  arrow: { color: C.border, fontSize: 22, paddingRight: 14 },
  fab: {
    position: 'absolute', bottom: 28 + safeBottom, right: 24, backgroundColor: C.gold,
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 28, color: '#000', fontWeight: 'bold', marginTop: -2 },
});
