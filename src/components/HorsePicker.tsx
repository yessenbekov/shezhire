import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import type { Horse, Sex } from '../types';

interface Props {
  visible: boolean;
  sexFilter?: Sex;          // 'м' | 'ж' — если передан, фильтрует по полу
  excludeId?: string;       // текущая лошадь — чтобы не выбрать саму себя
  onSelect: (horse: Horse) => void;
  onClear: () => void;
  onClose: () => void;
  title: string;
}

export default function HorsePicker({ visible, sexFilter, excludeId, onSelect, onClear, onClose, title }: Props) {
  const insets = useSafeAreaInsets();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) { setQuery(''); loadHorses(); }
  }, [visible]);

  async function loadHorses() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let q = supabase
      .from('shezhire_horses')
      .select('*')
      .eq('owner_id', user!.id)
      .order('brand');

    if (sexFilter) q = q.eq('sex', sexFilter);

    const { data } = await q;
    setHorses((data ?? []).filter(h => h.id !== excludeId) as Horse[]);
    setLoading(false);
  }

  const filtered = query.trim()
    ? horses.filter(h =>
        h.brand.includes(query) ||
        (h.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : horses;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={[styles.overlay, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Хедер */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Поиск */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Клеймо немесе кличка..."
              placeholderTextColor="#555"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Очистить выбор */}
          <TouchableOpacity style={styles.clearRow} onPress={() => { onClear(); onClose(); }}>
            <Text style={styles.clearText}>— Белгісіз (тазарту)</Text>
          </TouchableOpacity>

          {/* Список */}
          {loading ? (
            <ActivityIndicator color="#e8b84b" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={h => h.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>Лошадь табылмады</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.itemRight}>
                    {item.name
                      ? <Text style={styles.itemName}>{item.name}</Text>
                      : null
                    }
                    <Text style={styles.itemYear}>{item.birth_year} ж.</Text>
                  </View>
                  <Text style={styles.itemSex}>{item.sex === 'м' ? '♂' : '♀'}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#2a2a4a' },
  title: { color: '#e8b84b', fontSize: 17, fontWeight: 'bold' },
  closeBtn: { color: '#888', fontSize: 20, paddingLeft: 16 },
  searchRow: { padding: 12, paddingBottom: 0 },
  searchInput: { backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#2a2a4a' },
  clearRow: { padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#2a2a4a' },
  clearText: { color: '#666', fontSize: 14 },
  empty: { color: '#555', textAlign: 'center', marginTop: 32, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#2a2a4a' },
  itemBrand: { color: '#e8b84b', fontSize: 17, fontWeight: 'bold', fontFamily: 'monospace', width: 72 },
  itemRight: { flex: 1 },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  itemYear: { color: '#888', fontSize: 12, marginTop: 1 },
  itemSex: { color: '#666', fontSize: 18, marginLeft: 8 },
});
