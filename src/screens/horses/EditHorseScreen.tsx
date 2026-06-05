import React, { useState, useEffect } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import HorsePicker from '../../components/HorsePicker';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'EditHorse'>;
  route: RouteProp<HerdsStackParamList, 'EditHorse'>;
};

export default function EditHorseScreen({ navigation, route }: Props) {
  const { horseId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brand, setBrand] = useState('');
  const [birthYear, setBirthYear] = useState(0);
  const [sex, setSex] = useState('');

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [sire, setSire] = useState<Horse | null>(null);
  const [dam, setDam] = useState<Horse | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [showSirePicker, setShowSirePicker] = useState(false);
  const [showDamPicker, setShowDamPicker] = useState(false);

  useEffect(() => { loadHorse(); }, [horseId]);

  async function loadHorse() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shezhire_horses')
      .select('*')
      .eq('id', horseId)
      .single();

    if (error || !data) {
      Alert.alert('Қате', 'Лошадь табылмады');
      navigation.goBack();
      return;
    }

    setBrand(data.brand);
    setBirthYear(data.birth_year);
    setSex(data.sex);
    setName(data.name ?? '');
    setBreed(data.breed ?? '');
    setColor(data.color ?? '');
    setNotes(data.notes ?? '');
    setIsPublic(data.is_public);

    // Әкесі мен шешесін жеке жүктеу
    const [{ data: sireData }, { data: damData }] = await Promise.all([
      data.sire_id
        ? supabase.from('shezhire_horses').select('id, brand, name, sex, birth_year, sequence_no, is_public, owner_id, herd_id, breed, color, notes, sire_id, dam_id, created_at, updated_at').eq('id', data.sire_id).single()
        : Promise.resolve({ data: null }),
      data.dam_id
        ? supabase.from('shezhire_horses').select('id, brand, name, sex, birth_year, sequence_no, is_public, owner_id, herd_id, breed, color, notes, sire_id, dam_id, created_at, updated_at').eq('id', data.dam_id).single()
        : Promise.resolve({ data: null }),
    ]);

    setSire(sireData as Horse | null);
    setDam(damData as Horse | null);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('shezhire_horses')
      .update({
        name: name.trim() || null,
        breed: breed.trim() || null,
        color: color.trim() || null,
        sire_id: sire?.id ?? null,
        dam_id: dam?.id ?? null,
        notes: notes.trim() || null,
        is_public: isPublic,
      })
      .eq('id', horseId);

    if (error) Alert.alert('Қате', error.message);
    else navigation.goBack();
    setSaving(false);
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#C8922A" style={{ flex: 1, backgroundColor: '#1C0A0A' }} />;
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#1C0A0A' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          <Text style={styles.section}>Клеймо (өзгермейді)</Text>
          <View style={styles.brandBox}>
            <Text style={styles.brandText}>{brand}</Text>
            <Text style={styles.brandSub}>{sex === 'м' ? '♂ Айғыр' : '♀ Бие'} · {birthYear} ж.</Text>
          </View>

          <Text style={styles.section}>Қосымша мәліметтер</Text>
          <TextInput style={styles.input} placeholder="Кличкасы" placeholderTextColor="#5A3A2A" value={name} onChangeText={setName} returnKeyType="next" />
          <TextInput style={styles.input} placeholder="Тұқымы (мысалы: Жабы, Ахалтеке)" placeholderTextColor="#5A3A2A" value={breed} onChangeText={setBreed} returnKeyType="next" />
          <TextInput style={styles.input} placeholder="Түсі (мысалы: Торы, Қара)" placeholderTextColor="#5A3A2A" value={color} onChangeText={setColor} returnKeyType="next" />

          <Text style={styles.section}>Шежіре байланыстары</Text>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSirePicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>♂ Әкесі</Text>
              {sire
                ? <Text style={styles.pickerValue}>{sire.brand}{sire.name ? ` · ${sire.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>Таңдаңыз...</Text>
              }
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDamPicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>♀ Шешесі</Text>
              {dam
                ? <Text style={styles.pickerValue}>{dam.brand}{dam.name ? ` · ${dam.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>Таңдаңыз...</Text>
              }
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { height: 80, marginTop: 4 }]}
            placeholder="Жазбалар..."
            placeholderTextColor="#5A3A2A"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Жалпыға қолжетімді</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#C8922A' }} />
          </View>

          <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Сақталуда...' : 'Сақтау'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <HorsePicker
        visible={showSirePicker}
        sexFilter="м"
        excludeId={horseId}
        onSelect={h => setSire(h)}
        onClear={() => setSire(null)}
        onClose={() => setShowSirePicker(false)}
        title="Әкесін таңдаңыз (♂ Айғыр)"
      />
      <HorsePicker
        visible={showDamPicker}
        sexFilter="ж"
        excludeId={horseId}
        onSelect={h => setDam(h)}
        onClear={() => setDam(null)}
        onClose={() => setShowDamPicker(false)}
        title="Шешесін таңдаңыз (♀ Бие)"
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: { color: '#C8922A', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  brandBox: { backgroundColor: '#2A1210', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#5A2820', marginBottom: 4 },
  brandText: { color: '#C8922A', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  brandSub: { color: '#9A7A5A', fontSize: 14, marginTop: 4 },
  input: { backgroundColor: '#2A1210', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#5A2820' },
  pickerBtn: { backgroundColor: '#2A1210', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#5A2820', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerLabel: { color: '#9A7A5A', fontSize: 12, marginBottom: 3 },
  pickerValue: { color: '#C8922A', fontSize: 15, fontWeight: '600' },
  pickerPlaceholder: { color: '#5A2820', fontSize: 15 },
  pickerArrow: { color: '#5A2820', fontSize: 24 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2A1210', borderRadius: 10, padding: 14, marginBottom: 10 },
  switchLabel: { color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#C8922A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
