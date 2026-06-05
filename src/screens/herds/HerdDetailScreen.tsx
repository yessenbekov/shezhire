import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
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
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadHorses(); }, [herdId]));

  async function loadHorses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('horses')
      .select('*')
      .eq('herd_id', herdId)
      .order('sequence_no', { ascending: true });
    if (!error && data) setHorses(data);
    setLoading(false);
  }

  const mares = horses.filter(h => h.sex === 'ж');
  const stallions = horses.filter(h => h.sex === 'м');

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{horses.length}</Text>
          <Text style={styles.statLabel}>Барлығы</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stallions.length}</Text>
          <Text style={styles.statLabel}>Айғыр</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{mares.length}</Text>
          <Text style={styles.statLabel}>Бие</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e8b84b" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={horses}
          keyExtractor={h => h.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Бұл табунда лошадь жоқ</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('HorseDetail', { horseId: item.id })}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.brand}>{item.brand}</Text>
                <Text style={styles.sexBadge}>{item.sex === 'м' ? '♂ Айғыр' : '♀ Бие'}</Text>
              </View>
              <View style={styles.cardRight}>
                {item.name && <Text style={styles.horseName}>{item.name}</Text>}
                <Text style={styles.year}>{item.birth_year} ж.</Text>
                {item.breed && <Text style={styles.breed}>{item.breed}</Text>}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddHorse', { herdId })}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  stats: { flexDirection: 'row', backgroundColor: '#1a1a2e', padding: 16, gap: 12 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#0f0f1a', borderRadius: 10, padding: 12 },
  statNum: { color: '#e8b84b', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4a' },
  cardLeft: { marginRight: 16, alignItems: 'center', minWidth: 70 },
  brand: { color: '#e8b84b', fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
  sexBadge: { color: '#888', fontSize: 11, marginTop: 4 },
  cardRight: { flex: 1 },
  horseName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  year: { color: '#888', fontSize: 13, marginTop: 2 },
  breed: { color: '#666', fontSize: 12, marginTop: 1 },
  arrow: { color: '#444', fontSize: 24 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e8b84b', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#000', fontWeight: 'bold', marginTop: -2 },
});
