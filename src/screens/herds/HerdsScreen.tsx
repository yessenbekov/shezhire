import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import type { Colors } from '../../theme';
import type { Herd } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HerdsStackParamList } from '../../navigation';

type HerdWithCount = Herd & { horses: { id: string; sex: string }[] };
type Props = { navigation: NativeStackNavigationProp<HerdsStackParamList, 'Herds'> };

export default function HerdsScreen({ navigation }: Props) {
  const { C } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C, insets.bottom), [C, insets.bottom]);

  const [herds, setHerds] = useState<HerdWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { loadHerds(); }, []));

  async function loadHerds() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shezhire_herds')
      .select('*, horses:shezhire_horses(id, sex)')
      .order('created_at', { ascending: false });
    if (!error && data) setHerds(data as HerdWithCount[]);
    setLoading(false);
  }

  async function addHerd() {
    if (!newName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('shezhire_herds').insert({
      name: newName.trim(),
      location: newLocation.trim() || null,
      owner_id: user!.id,
    });
    if (error) Alert.alert(t.error, error.message);
    else {
      setModalVisible(false);
      setNewName('');
      setNewLocation('');
      loadHerds();
    }
    setSaving(false);
  }

  function showHerdMenu(item: HerdWithCount) {
    Alert.alert(item.name, '', [
      { text: t.delete, style: 'destructive', onPress: () => confirmDelete(item.id) },
      { text: t.close, style: 'cancel' },
    ]);
  }

  function confirmDelete(id: string) {
    Alert.alert(t.herds_delete, t.herds_deleteConfirm, [
      { text: t.no, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        await supabase.from('shezhire_herds').delete().eq('id', id);
        loadHerds();
      }},
    ]);
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={C.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={herds}
          keyExtractor={h => h.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🐎</Text>
              <Text style={styles.emptyTitle}>{t.herds_empty}</Text>
              <Text style={styles.emptySub}>{t.herds_emptyHint}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = item.horses?.length ?? 0;
            const males = item.horses?.filter(h => h.sex === 'м').length ?? 0;
            const females = item.horses?.filter(h => h.sex === 'ж').length ?? 0;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('HerdDetail', { herdId: item.id, herdName: item.name })}
                activeOpacity={0.75}
              >
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.location ? <Text style={styles.cardSub}>📍 {item.location}</Text> : null}
                  <View style={styles.countRow}>
                    <Text style={styles.countTotal}>{total} {t.herds_count}</Text>
                    {total > 0 && (
                      <>
                        <View style={styles.countDot} />
                        <Text style={styles.countMale}>♂ {males}</Text>
                        <Text style={styles.countFemale}>  ♀ {females}</Text>
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => showHerdMenu(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.moreText}>⋯</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t.herds_new}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.herds_name}
              placeholderTextColor={C.faint}
              value={newName}
              onChangeText={setNewName}
              returnKeyType="next"
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder={t.herds_location}
              placeholderTextColor={C.faint}
              value={newLocation}
              onChangeText={setNewLocation}
              returnKeyType="done"
              onSubmitEditing={addHerd}
            />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addHerd} disabled={saving}>
                <Text style={[styles.btnText, { color: '#000' }]}>{saving ? '...' : t.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (C: Colors, safeBottom: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySub: { color: C.faint, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 },
  card: { backgroundColor: C.surface, borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: C.gold },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  cardSub: { color: C.muted, marginTop: 3, fontSize: 13 },
  countRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  countTotal: { color: C.gold, fontSize: 13, fontWeight: '600' },
  countDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.border, marginHorizontal: 8 },
  countMale: { color: C.male, fontSize: 13 },
  countFemale: { color: C.female, fontSize: 13 },
  moreBtn: { paddingHorizontal: 16, paddingVertical: 20 },
  moreText: { color: C.muted, fontSize: 22, letterSpacing: 2 },
  fab: {
    position: 'absolute', bottom: 28 + safeBottom, right: 24, backgroundColor: C.gold,
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 28, color: '#000', fontWeight: 'bold', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: C.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: C.bg, color: C.text, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnCancel: { backgroundColor: C.surfaceAlt },
  btnAdd: { backgroundColor: C.gold },
  btnText: { color: C.text, fontWeight: 'bold', fontSize: 16 },
});
