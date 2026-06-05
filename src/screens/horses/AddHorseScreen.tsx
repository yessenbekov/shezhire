import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { supabase } from '../../lib/supabase';
import { parseBrand } from '../../types';
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
  const [sireBrand, setSireBrand] = useState('');
  const [damBrand, setDamBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parsed = parseBrand(brand);
    setParsedInfo(parsed);
  }, [brand]);

  async function findHorseByBrand(b: string): Promise<string | null> {
    const { data } = await supabase.from('horses').select('id').eq('brand', b).single();
    return data?.id ?? null;
  }

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

    const sireId = sireBrand.trim() ? await findHorseByBrand(sireBrand.trim()) : null;
    const damId = damBrand.trim() ? await findHorseByBrand(damBrand.trim()) : null;

    const { error } = await supabase.from('horses').insert({
      owner_id: user!.id,
      herd_id: herdId ?? null,
      brand: brand.trim(),
      sequence_no: parsed.sequenceNo,
      birth_year: parsed.birthYear,
      sex: parsed.sex,
      name: name.trim() || null,
      breed: breed.trim() || null,
      color: color.trim() || null,
      sire_id: sireId,
      dam_id: damId,
      notes: notes.trim() || null,
      is_public: isPublic,
    });

    if (error) {
      Alert.alert('Қате', error.message);
    } else {
      navigation.goBack();
    }
    setSaving(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.section}>Клеймо</Text>
      <TextInput
        style={styles.input}
        placeholder="ЖЖ/НН (мысалы: 26/35)"
        placeholderTextColor="#666"
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
      <TextInput style={styles.input} placeholder="Кличкасы (міндетті емес)" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Тұқымы (мысалы: Жабы, Ахалтеке)" placeholderTextColor="#666" value={breed} onChangeText={setBreed} />
      <TextInput style={styles.input} placeholder="Түсі (мысалы: Торы, Қара)" placeholderTextColor="#666" value={color} onChangeText={setColor} />

      <Text style={styles.section}>Шежіре байланыстары</Text>
      <TextInput style={styles.input} placeholder="Әкесінің клеймосы (мысалы: 20/11)" placeholderTextColor="#666" value={sireBrand} onChangeText={setSireBrand} />
      <TextInput style={styles.input} placeholder="Шешесінің клеймосы (мысалы: 19/08)" placeholderTextColor="#666" value={damBrand} onChangeText={setDamBrand} />

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Жазбалар..."
        placeholderTextColor="#666"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Жалпыға қолжетімді</Text>
        <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#e8b84b' }} />
      </View>

      <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Сақталуда...' : 'Сақтау'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  section: { color: '#e8b84b', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  parsedBox: { backgroundColor: '#1a2e1a', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2a4a2a' },
  parsedText: { color: '#6aff6a', fontSize: 14, marginBottom: 2 },
  error: { color: '#ff6a6a', fontSize: 13, marginBottom: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, marginBottom: 10 },
  switchLabel: { color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#e8b84b', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
