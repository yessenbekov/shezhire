import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import { getAgeName } from '../../utils/horseAge';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import type { Colors } from '../../theme';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HerdsStackParamList } from '../../navigation';

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HerdsStackParamList>>();
  const { C, ageNames } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const gen = ++generation.current;
    debounceTimer.current = setTimeout(() => runSearch(q, gen), 300);
  }

  async function runSearch(q: string, gen: number) {
    setError(null);
    const { data, error: err } = await supabase
      .from('shezhire_horses')
      .select('*')
      .eq('is_public', true)
      .or(`brand.ilike.%${q}%,name.ilike.%${q}%,breed.ilike.%${q}%`)
      .order('brand')
      .limit(50);

    if (gen !== generation.current) return; // stale response — discard

    if (err) setError(err.message);
    setResults((data ?? []) as Horse[]);
    setSearched(true);
    setLoading(false);
  }

  function clearSearch() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    generation.current++;
    setQuery('');
    setResults([]);
    setSearched(false);
    setLoading(false);
    setError(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t.search_placeholder}
          placeholderTextColor={C.faint}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Text style={{ color: C.muted, fontSize: 18, paddingLeft: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={{ padding: 14 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {!loading && !searched && (
        <EmptyState icon="search" title={t.search_hint} />
      )}

      {!loading && searched && results.length === 0 && !error && (
        <EmptyState icon="search" title={`«${query}» ${t.search_notFound}`} />
      )}

      {!loading && error && (
        <EmptyState icon="search" title={t.error} subtitle={error} />
      )}

      {!loading && (
        <FlatList
          data={results}
          keyExtractor={h => h.id}
          contentContainerStyle={{ padding: 14 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isMale = item.sex === 'м';
            const ageName = getAgeName(item.birth_year, item.sex, ageNames);
            return (
              <TouchableOpacity
                style={styles.card}
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
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, margin: 14, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sexStrip: { width: 4, alignSelf: 'stretch' },
  brandWrap: { paddingHorizontal: 14, paddingVertical: 14, alignItems: 'center', minWidth: 76 },
  brand: { fontSize: 17, fontWeight: '800', fontFamily: 'monospace' },
  sexIcon: { fontSize: 14, marginTop: 4 },
  cardInfo: { flex: 1, paddingVertical: 12, paddingLeft: 6 },
  horseName: { color: C.text, fontSize: 15, fontWeight: '600' },
  ageName: { color: C.muted, fontSize: 13, marginTop: 2 },
  breed: { color: C.faint, fontSize: 12, marginTop: 1 },
  arrow: { color: C.border, fontSize: 20, paddingRight: 14 },
});
