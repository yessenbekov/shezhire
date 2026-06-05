import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import type { Herd } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HerdsStackParamList } from '../../navigation';

type Props = { navigation: NativeStackNavigationProp<HerdsStackParamList, 'Herds'> };

export default function HerdsScreen({ navigation }: Props) {
  const [herds, setHerds] = useState<Herd[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { loadHerds(); }, []));

  async function loadHerds() {
    setLoading(true);
    const { data, error } = await supabase
      .from('herds')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setHerds(data);
    setLoading(false);
  }

  async function addHerd() {
    if (!newName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('herds').insert({ name: newName.trim(), location: newLocation.trim() || null, owner_id: user!.id });
    if (error) Alert.alert('Қате', error.message);
    else {
      setModalVisible(false);
      setNewName('');
      setNewLocation('');
      loadHerds();
    }
    setSaving(false);
  }

  async function deleteHerd(id: string) {
    Alert.alert('Жою', 'Табунды жою керек пе?', [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => {
        await supabase.from('herds').delete().eq('id', id);
        loadHerds();
      }},
    ]);
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#e8b84b" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={herds}
          keyExtractor={h => h.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Табун жоқ. Жаңа табун қосыңыз!</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('HerdDetail', { herdId: item.id, herdName: item.name })}
              onLongPress={() => deleteHerd(item.id)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.location && <Text style={styles.cardSub}>📍 {item.location}</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Жаңа табун</Text>
            <TextInput style={styles.input} placeholder="Атауы (мысалы: Солтүстік табун)" placeholderTextColor="#666" value={newName} onChangeText={setNewName} />
            <TextInput style={styles.input} placeholder="Орналасуы (міндетті емес)" placeholderTextColor="#666" value={newLocation} onChangeText={setNewLocation} />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Бас тарту</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnAdd]} onPress={addHerd} disabled={saving}>
                <Text style={[styles.btnText, { color: '#000' }]}>{saving ? '...' : 'Қосу'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4a' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: '#888', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e8b84b', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#000', fontWeight: 'bold', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { color: '#e8b84b', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  btnCancel: { backgroundColor: '#2a2a4a' },
  btnAdd: { backgroundColor: '#e8b84b' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
