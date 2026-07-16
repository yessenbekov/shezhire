import React, { useState, useEffect, useMemo } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import HorsePicker from '../../components/HorsePicker';
import type { Colors } from '../../theme';
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
  const { C } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState('');
  const [birthYear, setBirthYear] = useState(0);
  const [sex, setSex] = useState<'м' | 'ж'>('м');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [sire, setSire] = useState<Horse | null>(null);
  const [dam, setDam] = useState<Horse | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLead, setIsLead] = useState(false);
  const [showSirePicker, setShowSirePicker] = useState(false);
  const [showDamPicker, setShowDamPicker] = useState(false);

  useEffect(() => { loadHorse(); }, [horseId]);

  async function loadHorse() {
    setLoading(true);
    const { data, error } = await supabase.from('shezhire_horses').select('*').eq('id', horseId).single();
    if (error || !data) {
      Alert.alert(t.error, t.horse_notFound);
      navigation.goBack();
      return;
    }
    setBrand(data.brand);
    setBirthYear(data.birth_year);
    setSex(data.sex as 'м' | 'ж');
    setName(data.name ?? '');
    setBreed(data.breed ?? '');
    setColor(data.color ?? '');
    setNotes(data.notes ?? '');
    setIsPublic(data.is_public);
    setIsLead(data.is_lead ?? false);

    const [{ data: sireData }, { data: damData }] = await Promise.all([
      data.sire_id ? supabase.from('shezhire_horses').select('*').eq('id', data.sire_id).single() : Promise.resolve({ data: null }),
      data.dam_id ? supabase.from('shezhire_horses').select('*').eq('id', data.dam_id).single() : Promise.resolve({ data: null }),
    ]);
    setSire(sireData as Horse | null);
    setDam(damData as Horse | null);
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('shezhire_horses').update({
      sex,
      name: name.trim() || null,
      breed: breed.trim() || null,
      color: color.trim() || null,
      sire_id: sire?.id ?? null,
      dam_id: dam?.id ?? null,
      notes: notes.trim() || null,
      is_public: isPublic,
      is_lead: isLead,
    }).eq('id', horseId);
    if (error) Alert.alert(t.error, error.message);
    else navigation.goBack();
    setSaving(false);
  }

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          <Text style={styles.section}>{t.horse_brandFixed}</Text>
          <View style={styles.brandBox}>
            <Text style={styles.brandText}>{brand}</Text>
            <Text style={styles.brandSub}>{birthYear} {t.horse_bornYear}</Text>
          </View>

          <Text style={styles.section}>{t.horse_sexLabel}</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity
              style={[styles.sexBtn, { borderColor: sex === 'м' ? C.maleBorder : C.border, backgroundColor: sex === 'м' ? C.maleBg : C.surface }]}
              onPress={() => setSex('м')}
            >
              <Text style={[styles.sexBtnText, { color: sex === 'м' ? C.male : C.muted }]}>{t.sex_male}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sexBtn, { borderColor: sex === 'ж' ? C.femaleBorder : C.border, backgroundColor: sex === 'ж' ? C.femaleBg : C.surface }]}
              onPress={() => setSex('ж')}
            >
              <Text style={[styles.sexBtnText, { color: sex === 'ж' ? C.female : C.muted }]}>{t.sex_female}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>{t.horse_additional}</Text>
          <TextInput style={styles.input} placeholder={t.horse_namePlaceholder} placeholderTextColor={C.faint} value={name} onChangeText={setName} returnKeyType="next" />
          <TextInput style={styles.input} placeholder={t.horse_breedPlaceholder} placeholderTextColor={C.faint} value={breed} onChangeText={setBreed} returnKeyType="next" />
          <TextInput style={styles.input} placeholder={t.horse_colorPlaceholder} placeholderTextColor={C.faint} value={color} onChangeText={setColor} returnKeyType="next" />

          <Text style={styles.section}>{t.horse_pedigreeLinks}</Text>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSirePicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_father}</Text>
              {sire ? <Text style={styles.pickerValue}>{sire.brand}{sire.name ? ` · ${sire.name}` : ''}</Text>
                    : <Text style={styles.pickerPlaceholder}>{t.select}</Text>}
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDamPicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_mother}</Text>
              {dam ? <Text style={styles.pickerValue}>{dam.brand}{dam.name ? ` · ${dam.name}` : ''}</Text>
                   : <Text style={styles.pickerPlaceholder}>{t.select}</Text>}
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TextInput style={[styles.input, { height: 80, marginTop: 4 }]} placeholder={t.horse_notesPlaceholder} placeholderTextColor={C.faint} value={notes} onChangeText={setNotes} multiline />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t.horse_isLead}</Text>
            <Switch value={isLead} onValueChange={setIsLead} trackColor={{ true: C.gold }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t.horse_public}</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: C.gold }} />
          </View>

          <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? t.saving : t.save}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <HorsePicker visible={showSirePicker} sexFilter="м" excludeId={horseId} onSelect={h => setSire(h)} onClear={() => setSire(null)} onClose={() => setShowSirePicker(false)} title={t.horse_pickerFather} />
      <HorsePicker visible={showDamPicker} sexFilter="ж" excludeId={horseId} onSelect={h => setDam(h)} onClear={() => setDam(null)} onClose={() => setShowDamPicker(false)} title={t.horse_pickerMother} />
    </>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  section: { color: C.gold, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  brandBox: { backgroundColor: C.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  brandText: { color: C.gold, fontSize: 28, fontWeight: 'bold', fontFamily: 'monospace' },
  brandSub: { color: C.muted, fontSize: 14, marginTop: 4 },
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  sexBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
  sexBtnText: { fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: C.border },
  pickerBtn: { backgroundColor: C.surface, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerLabel: { color: C.muted, fontSize: 12, marginBottom: 3 },
  pickerValue: { color: C.gold, fontSize: 15, fontWeight: '600' },
  pickerPlaceholder: { color: C.faint, fontSize: 15 },
  pickerArrow: { color: C.faint, fontSize: 24 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, padding: 14, marginBottom: 10 },
  switchLabel: { color: C.text, fontSize: 16 },
  button: { backgroundColor: C.gold, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
