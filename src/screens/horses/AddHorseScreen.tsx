import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { parseBrand } from '../../types';
import HorsePicker from '../../components/HorsePicker';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'AddHorse'>;
  route: RouteProp<HerdsStackParamList, 'AddHorse'>;
};

export default function AddHorseScreen({ navigation, route }: Props) {
  const { herdId } = route.params;
  const [brand, setBrand] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{ sequenceNo: number; birthYear: number; sex: 'м' | 'ж' } | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [sire, setSire] = useState<Horse | null>(null);
  const [dam, setDam] = useState<Horse | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSirePicker, setShowSirePicker] = useState(false);
  const [showDamPicker, setShowDamPicker] = useState(false);

  useEffect(() => {
    setParsedInfo(parseBrand(brand));
  }, [brand]);

  async function save() {
    if (!brand.trim()) {
      Alert.alert('Қате', 'Клеймо нөмірін енгізіңіз');
      return;
    }
    const parsed = parseBrand(brand.trim());
    if (!parsed) {
      Alert.alert('Қате', 'Клеймо форматы: ЖЖ/НН (мысалы: 26/35)');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('shezhire_horses').insert({
      owner_id: user!.id,
      herd_id: herdId ?? null,
      brand: brand.trim(),
      sequence_no: parsed.sequenceNo,
      birth_year: parsed.birthYear,
      sex: parsed.sex,
      name: name.trim() || null,
      breed: breed.trim() || null,
      color: color.trim() || null,
      sire_id: sire?.id ?? null,
      dam_id: dam?.id ?? null,
      notes: notes.trim() || null,
      is_public: isPublic,
    });

    if (error) Alert.alert('Қате', error.message);
    else navigation.goBack();
    setSaving(false);
  }

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#1C0A0A' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          <Text style={styles.section}>Клеймо</Text>
          <TextInput
            style={styles.input}
            placeholder="ЖЖ/НН (мысалы: 26/35)"
            placeholderTextColor="#5A3A2A"
            value={brand}
            onChangeText={setBrand}
            autoCapitalize="none"
          />
          {parsedInfo && (
            <View style={styles.parsedBox}>
              <Text style={styles.parsedText}>📅 {parsedInfo.birthYear} жылы туылған</Text>
              <Text style={styles.parsedText}>{parsedInfo.sex === 'м' ? '♂ Айғыр (тақ сан)' : '♀ Бие (жұп сан)'}</Text>
              <Text style={styles.parsedText}>№ {parsedInfo.sequenceNo}</Text>
            </View>
          )}
          {brand && !parsedInfo && (
            <Text style={styles.error}>Формат дұрыс емес. ЖЖ/НН форматын пайдаланыңыз</Text>
          )}

          <Text style={styles.section}>Қосымша мәліметтер</Text>
          <TextInput style={styles.input} placeholder="Кличкасы (міндетті емес)" placeholderTextColor="#5A3A2A" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Тұқымы (мысалы: Жабы, Ахалтеке)" placeholderTextColor="#5A3A2A" value={breed} onChangeText={setBreed} />
          <TextInput style={styles.input} placeholder="Түсі (мысалы: Торы, Қара)" placeholderTextColor="#5A3A2A" value={color} onChangeText={setColor} />

          <Text style={styles.section}>Шежіре байланыстары</Text>

          {/* Әкесі */}
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

          {/* Шешесі */}
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
        onSelect={h => setSire(h)}
        onClear={() => setSire(null)}
        onClose={() => setShowSirePicker(false)}
        title="Әкесін таңдаңыз (♂ Айғыр)"
      />
      <HorsePicker
        visible={showDamPicker}
        sexFilter="ж"
        onSelect={h => setDam(h)}
        onClear={() => setDam(null)}
        onClose={() => setShowDamPicker(false)}
        title="Шешесін таңдаңыз (♀ Бие)"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C0A0A' },
  section: { color: '#C8922A', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#2A1210', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#5A2820' },
  parsedBox: { backgroundColor: '#1A4A44', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1A4A44' },
  parsedText: { color: '#2D7D6F', fontSize: 14, marginBottom: 2 },
  error: { color: '#ff6a6a', fontSize: 13, marginBottom: 10 },
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
