import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import type { Colors } from '../theme';
import type { Horse, Sex } from '../types';

interface Props {
  visible: boolean;
  sexFilter?: Sex;
  excludeId?: string;
  onSelect: (horse: Horse) => void;
  onClear: () => void;
  onClose: () => void;
  title: string;
}

export default function HorsePicker({ visible, sexFilter, excludeId, onSelect, onClear, onClose, title }: Props) {
  const insets = useSafeAreaInsets();
  const { C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [horses, setHorses] = useState<Horse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) { setQuery(''); loadHorses(); }
  }, [visible]);

  async function loadHorses() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let q = supabase.from('shezhire_horses').select('*').eq('owner_id', user!.id).order('brand');
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
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Клеймо немесе кличка..."
              placeholderTextColor={C.faint}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.clearRow} onPress={() => { onClear(); onClose(); }}>
            <Text style={styles.clearText}>— Белгісіз (тазарту)</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={h => h.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>Лошадь табылмады</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.itemRight}>
                    {item.name ? <Text style={styles.itemName}>{item.name}</Text> : null}
                    <Text style={styles.itemYear}>{item.birth_year} ж.</Text>
                  </View>
                  <Text style={[styles.itemSex, { color: item.sex === 'м' ? C.male : C.female }]}>{item.sex === 'м' ? '♂' : '♀'}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: C.border },
  title: { color: C.gold, fontSize: 17, fontWeight: 'bold' },
  closeBtn: { color: C.muted, fontSize: 20, paddingLeft: 16 },
  searchRow: { padding: 12, paddingBottom: 0 },
  searchInput: { backgroundColor: C.bg, color: C.text, borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: C.border },
  clearRow: { padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: C.border },
  clearText: { color: C.faint, fontSize: 14 },
  empty: { color: C.faint, textAlign: 'center', marginTop: 32, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: C.border },
  itemBrand: { color: C.gold, fontSize: 17, fontWeight: 'bold', fontFamily: 'monospace', width: 72 },
  itemRight: { flex: 1 },
  itemName: { color: C.text, fontSize: 14, fontWeight: '600' },
  itemYear: { color: C.muted, fontSize: 12, marginTop: 1 },
  itemSex: { fontSize: 18, marginLeft: 8 },
});
