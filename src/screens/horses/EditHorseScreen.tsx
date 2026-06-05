import React, { useState, useEffect } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { parseBrand } from '../../types';
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

  // Неизменяемые поля (из клейма)
  const [brand, setBrand] = useState('');
  const [birthYear, setBirthYear] = useState(0);
  const [sex, setSex] = useState('');

  // Редактируемые поля
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [sireBrand, setSireBrand] = useState('');
  const [damBrand, setDamBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => { loadHorse(); }, [horseId]);

  async function loadHorse() {
    setLoading(true);
    const { data, error } = await supabase
      .from('shezhire_horses')
      .select('*, sire:sire_id(brand), dam:dam_id(brand)')
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
    setSireBrand((data.sire as any)?.brand ?? '');
    setDamBrand((data.dam as any)?.brand ?? '');
    setNotes(data.notes ?? '');
    setIsPublic(data.is_public);
    setLoading(false);
  }

  async function findHorseByBrand(b: string): Promise<string | null> {
    const { data } = await supabase
      .from('shezhire_horses')
      .select('id')
      .eq('brand', b)
      .single();
    return data?.id ?? null;
  }

  async function save() {
    setSaving(true);

    const sireId = sireBrand.trim() ? await findHorseByBrand(sireBrand.trim()) : null;
    const damId = damBrand.trim() ? await findHorseByBrand(damBrand.trim()) : null;

    const { error } = await supabase
      .from('shezhire_horses')
      .update({
        name: name.trim() || null,
        breed: breed.trim() || null,
        color: color.trim() || null,
        sire_id: sireId,
        dam_id: damId,
        notes: notes.trim() || null,
        is_public: isPublic,
      })
      .eq('id', horseId);

    if (error) {
      Alert.alert('Қате', error.message);
    } else {
      navigation.goBack();
    }
    setSaving(false);
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#e8b84b" style={{ flex: 1, backgroundColor: '#0f0f1a' }} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

        {/* Клеймо — только чтение */}
        <Text style={styles.section}>Клеймо (өзгермейді)</Text>
        <View style={styles.brandBox}>
          <Text style={styles.brandText}>{brand}</Text>
          <Text style={styles.brandSub}>
            {sex === 'м' ? '♂ Айғыр' : '♀ Бие'} · {birthYear} ж.
          </Text>
        </View>

        <Text style={styles.section}>Қосымша мәліметтер</Text>
        <TextInput
          style={styles.input}
          placeholder="Кличкасы"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Тұқымы (мысалы: Жабы, Ахалтеке)"
          placeholderTextColor="#666"
          value={breed}
          onChangeText={setBreed}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Түсі (мысалы: Торы, Қара)"
          placeholderTextColor="#666"
          value={color}
          onChangeText={setColor}
          returnKeyType="next"
        />

        <Text style={styles.section}>Шежіре байланыстары</Text>
        <TextInput
          style={styles.input}
          placeholder="Әкесінің клеймосы (мысалы: 20/11)"
          placeholderTextColor="#666"
          value={sireBrand}
          onChangeText={setSireBrand}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Шешесінің клеймосы (мысалы: 19/08)"
          placeholderTextColor="#666"
          value={damBrand}
          onChangeText={setDamBrand}
          returnKeyType="next"
        />

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  section: { color: '#e8b84b', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  brandBox: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#2a2a4a', marginBottom: 4 },
  brandText: { color: '#e8b84b', fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  brandSub: { color: '#888', fontSize: 14, marginTop: 4 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#2a2a4a' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, marginBottom: 10 },
  switchLabel: { color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#e8b84b', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
