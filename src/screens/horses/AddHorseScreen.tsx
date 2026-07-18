import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { parseBrand } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import HorsePicker from '../../components/HorsePicker';
import type { Colors } from '../../theme';
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
  const { C } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [brand, setBrand] = useState('');
  const [parsedInfo, setParsedInfo] = useState<{ sequenceNo: number; birthYear: number; sex: 'м' | 'ж' } | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [sire, setSire] = useState<Horse | null>(null);
  const [dam, setDam] = useState<Horse | null>(null);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLead, setIsLead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSirePicker, setShowSirePicker] = useState(false);
  const [showDamPicker, setShowDamPicker] = useState(false);

  useEffect(() => { setParsedInfo(parseBrand(brand)); }, [brand]);

  async function save() {
    if (!brand.trim()) {
      Alert.alert(t.error, t.horse_brandError);
      return;
    }
    const parsed = parseBrand(brand.trim());
    if (!parsed) {
      Alert.alert(t.error, t.horse_brandFormatError);
      return;
    }

    setSaving(true);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      Alert.alert(t.error, t.auth_googleError);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('shezhire_horses').insert({
      owner_id: user.id,
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
      is_lead: isLead,
    });

    if (error) Alert.alert(t.error, error.message);
    else navigation.goBack();
    setSaving(false);
  }

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          <Text style={styles.section}>{t.horse_brandLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.horse_brandPlaceholder}
            placeholderTextColor={C.faint}
            value={brand}
            onChangeText={setBrand}
            autoCapitalize="none"
          />
          {parsedInfo && (
            <View style={[styles.parsedBox, { backgroundColor: C.maleBg, borderColor: C.maleBorder }]}>
              <Text style={[styles.parsedText, { color: C.male }]}>📅 {parsedInfo.birthYear} {t.horse_bornYear}</Text>
              <Text style={[styles.parsedText, { color: parsedInfo.sex === 'м' ? C.male : C.female }]}>{parsedInfo.sex === 'м' ? t.horse_oddEven_m : t.horse_oddEven_f}</Text>
              <Text style={[styles.parsedText, { color: C.male }]}>{t.horse_seqNo} {parsedInfo.sequenceNo}</Text>
            </View>
          )}
          {brand && !parsedInfo && (
            <Text style={styles.error}>{t.horse_formatHint}</Text>
          )}

          <Text style={styles.section}>{t.horse_additional}</Text>
          <TextInput style={styles.input} placeholder={t.horse_namePlaceholder} placeholderTextColor={C.faint} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={t.horse_breedPlaceholder} placeholderTextColor={C.faint} value={breed} onChangeText={setBreed} />
          <TextInput style={styles.input} placeholder={t.horse_colorPlaceholder} placeholderTextColor={C.faint} value={color} onChangeText={setColor} />

          <Text style={styles.section}>{t.horse_pedigreeLinks}</Text>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSirePicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_father}</Text>
              {sire
                ? <Text style={styles.pickerValue}>{sire.brand}{sire.name ? ` · ${sire.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>{t.select}</Text>
              }
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDamPicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_mother}</Text>
              {dam
                ? <Text style={styles.pickerValue}>{dam.brand}{dam.name ? ` · ${dam.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>{t.select}</Text>
              }
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { height: 80, marginTop: 4 }]}
            placeholder={t.horse_notesPlaceholder}
            placeholderTextColor={C.faint}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

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

      <HorsePicker
        visible={showSirePicker}
        sexFilter="м"
        onSelect={h => setSire(h)}
        onClear={() => setSire(null)}
        onClose={() => setShowSirePicker(false)}
        title={t.horse_pickerFather}
      />
      <HorsePicker
        visible={showDamPicker}
        sexFilter="ж"
        onSelect={h => setDam(h)}
        onClear={() => setDam(null)}
        onClose={() => setShowDamPicker(false)}
        title={t.horse_pickerMother}
      />
    </>
  );
}

const makeStyles = (C: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  section: { color: C.gold, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: C.border },
  parsedBox: { borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1 },
  parsedText: { fontSize: 14, marginBottom: 2 },
  error: { color: C.danger, fontSize: 13, marginBottom: 10 },
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
