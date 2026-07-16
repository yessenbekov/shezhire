import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import { getAgeName } from '../../utils/horseAge';
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

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('shezhire_horses')
      .select('*')
      .eq('is_public', true)
      .or(`brand.ilike.%${q}%,name.ilike.%${q}%,breed.ilike.%${q}%`)
      .order('brand')
      .limit(50);
    setResults((data ?? []) as Horse[]);
    setLoading(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={t.search_placeholder}
          placeholderTextColor={C.faint}
          value={query}
          onChangeText={q => { setQuery(q); search(q); }}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Text style={{ color: C.muted, fontSize: 18, paddingLeft: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator size="small" color={C.gold} style={{ marginTop: 24 }} />}

      {!loading && !searched && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintIcon}>🔍</Text>
          <Text style={styles.hintText}>{t.search_hint}</Text>
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.hintWrap}>
          <Text style={styles.hintIcon}>🐴</Text>
          <Text style={styles.hintText}>«{query}» {t.search_notFound}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={h => h.id}
        contentContainerStyle={{ padding: 14 }}
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
    </View>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, margin: 14, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 14 },
  hintWrap: { alignItems: 'center', paddingTop: 60 },
  hintIcon: { fontSize: 40, marginBottom: 14 },
  hintText: { color: C.faint, fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
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
