import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HerdsStackParamList } from '../../navigation';

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HerdsStackParamList>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from('horses')
      .select('*')
      .eq('is_public', true)
      .or(`brand.ilike.%${q}%,name.ilike.%${q}%,breed.ilike.%${q}%`)
      .order('brand')
      .limit(50);

    setResults((data ?? []) as Horse[]);
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Клеймо, кличка немесе тұқым..."
          placeholderTextColor="#555"
          value={query}
          onChangeText={q => { setQuery(q); search(q); }}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator size="small" color="#e8b84b" style={{ marginTop: 20 }} />}

      {!loading && searched && results.length === 0 && (
        <Text style={styles.empty}>Табылмады</Text>
      )}

      {!searched && (
        <Text style={styles.hint}>Клеймо нөмірі, кличка немесе тұқым бойынша іздеу жасаңыз</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={h => h.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HorseDetail', { horseId: item.id })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.brand}>{item.brand}</Text>
              <Text style={styles.sex}>{item.sex === 'м' ? '♂' : '♀'}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', margin: 16, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#2a2a4a' },
  searchIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 14 },
  clear: { color: '#666', fontSize: 18, paddingLeft: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  hint: { color: '#444', textAlign: 'center', marginTop: 60, fontSize: 14, paddingHorizontal: 40, lineHeight: 22 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardLeft: { alignItems: 'center', marginRight: 14, minWidth: 70 },
  brand: { color: '#e8b84b', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  sex: { fontSize: 16, marginTop: 2 },
  cardRight: { flex: 1 },
  horseName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  year: { color: '#888', fontSize: 13, marginTop: 2 },
  breed: { color: '#666', fontSize: 12 },
  arrow: { color: '#444', fontSize: 22 },
});
