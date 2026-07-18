import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import HorsePicker from '../../components/HorsePicker';
import type { Colors } from '../../theme';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type BrandMode = 'standard' | 'custom';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'AddHorse'>;
  route: RouteProp<HerdsStackParamList, 'AddHorse'>;
};

export default function AddHorseScreen({ navigation, route }: Props) {
  const { herdId } = route.params;
  const { C } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [brandMode, setBrandMode] = useState<BrandMode>('standard');

  // Standard mode fields
  const [yearStr, setYearStr] = useState('');
  const [seqStr, setSeqStr] = useState('');
  const [sexOverridden, setSexOverridden] = useState(false);

  // Custom mode fields
  const [customBrand, setCustomBrand] = useState('');
  const [customYearStr, setCustomYearStr] = useState('');

  // Shared
  const [sex, setSex] = useState<'м' | 'ж'>('м');
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

  const seqRef = useRef<TextInput>(null);

  // Auto-detect sex from seq number (standard mode only, unless user overrode)
  useEffect(() => {
    if (brandMode !== 'standard' || sexOverridden) return;
    const n = parseInt(seqStr, 10);
    if (!isNaN(n)) setSex(n % 2 === 0 ? 'ж' : 'м');
  }, [seqStr, brandMode]);

  function handleSexPress(s: 'м' | 'ж') {
    setSex(s);
    setSexOverridden(true);
  }

  function switchMode(mode: BrandMode) {
    setBrandMode(mode);
    setSexOverridden(false);
    setSex('м');
  }

  // Standard mode: assembled brand preview
  const yearNum = parseInt(yearStr, 10);
  const seqNum = parseInt(seqStr, 10);
  const brandPreview = yearStr.trim() && seqStr.trim() && !isNaN(yearNum) && !isNaN(seqNum)
    ? `${String(yearNum).padStart(2, '0')}/${seqNum}`
    : null;

  async function save() {
    let brand: string;
    let birthYear: number;
    let sequenceNo: number;

    if (brandMode === 'standard') {
      if (!yearStr.trim() || isNaN(yearNum) || yearNum < 0 || yearNum > 99) {
        Alert.alert(t.error, t.horse_yearError);
        return;
      }
      if (!seqStr.trim() || isNaN(seqNum) || seqNum < 1) {
        Alert.alert(t.error, t.horse_seqError);
        return;
      }
      brand = `${String(yearNum).padStart(2, '0')}/${seqNum}`;
      birthYear = 2000 + yearNum;
      sequenceNo = seqNum;
    } else {
      if (!customBrand.trim()) {
        Alert.alert(t.error, t.horse_brandCustomError);
        return;
      }
      const cy = parseInt(customYearStr, 10);
      if (!customYearStr.trim() || isNaN(cy) || cy < 1900 || cy > 2100) {
        Alert.alert(t.error, t.horse_yearFullError);
        return;
      }
      brand = customBrand.trim();
      birthYear = cy;
      sequenceNo = 0;
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
      brand,
      sequence_no: sequenceNo,
      birth_year: birthYear,
      sex,
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

  const isMale = sex === 'м';

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          {/* Brand section */}
          <Text style={styles.section}>{t.horse_brandLabel}</Text>

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, brandMode === 'standard' && { backgroundColor: C.gold, borderColor: C.gold }]}
              onPress={() => switchMode('standard')}
            >
              <Text style={[styles.modeBtnText, { color: brandMode === 'standard' ? '#000' : C.muted }]}>
                {t.horse_modeStandard}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, brandMode === 'custom' && { backgroundColor: C.gold, borderColor: C.gold }]}
              onPress={() => switchMode('custom')}
            >
              <Text style={[styles.modeBtnText, { color: brandMode === 'custom' ? '#000' : C.muted }]}>
                {t.horse_modeCustom}
              </Text>
            </TouchableOpacity>
          </View>

          {brandMode === 'standard' ? (
            <>
              <View style={styles.brandRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{t.horse_yearInput}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.horse_yearPlaceholder}
                    placeholderTextColor={C.faint}
                    value={yearStr}
                    onChangeText={v => setYearStr(v.replace(/\D/g, '').slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => seqRef.current?.focus()}
                  />
                </View>
                <Text style={styles.brandSlash}>/</Text>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.fieldLabel}>{t.horse_seqInput}</Text>
                  <TextInput
                    ref={seqRef}
                    style={styles.input}
                    placeholder={t.horse_seqPlaceholder}
                    placeholderTextColor={C.faint}
                    value={seqStr}
                    onChangeText={v => setSeqStr(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {brandPreview && (
                <View style={[styles.previewBox, { backgroundColor: C.maleBg, borderColor: C.maleBorder }]}>
                  <Text style={[styles.previewLabel, { color: C.muted }]}>{t.horse_brandLabel}</Text>
                  <Text style={[styles.previewBrand, { color: C.gold }]}>{brandPreview}</Text>
                  <Text style={[styles.previewYear, { color: C.muted }]}>
                    {2000 + yearNum} {t.horse_bornYear}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>{t.horse_brandLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.horse_brandCustomPlaceholder}
                placeholderTextColor={C.faint}
                value={customBrand}
                onChangeText={setCustomBrand}
                autoCapitalize="characters"
              />
              <Text style={styles.fieldLabel}>{t.horse_yearFull}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.horse_yearFullPlaceholder}
                placeholderTextColor={C.faint}
                value={customYearStr}
                onChangeText={v => setCustomYearStr(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </>
          )}

          {/* Sex */}
          <Text style={styles.section}>{t.horse_sexLabel}</Text>
          {brandMode === 'standard' && (
            <Text style={[styles.sexHint, { color: C.faint }]}>{t.horse_sexAutoHint}</Text>
          )}
          <View style={styles.sexRow}>
            <TouchableOpacity
              style={[styles.sexBtn, { borderColor: isMale ? C.maleBorder : C.border, backgroundColor: isMale ? C.maleBg : C.surface }]}
              onPress={() => handleSexPress('м')}
            >
              <Text style={[styles.sexBtnText, { color: isMale ? C.male : C.muted }]}>{t.sex_male}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sexBtn, { borderColor: !isMale ? C.femaleBorder : C.border, backgroundColor: !isMale ? C.femaleBg : C.surface }]}
              onPress={() => handleSexPress('ж')}
            >
              <Text style={[styles.sexBtnText, { color: !isMale ? C.female : C.muted }]}>{t.sex_female}</Text>
            </TouchableOpacity>
          </View>

          {/* Additional */}
          <Text style={styles.section}>{t.horse_additional}</Text>
          <TextInput style={styles.input} placeholder={t.horse_namePlaceholder} placeholderTextColor={C.faint} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={t.horse_breedPlaceholder} placeholderTextColor={C.faint} value={breed} onChangeText={setBreed} />
          <TextInput style={styles.input} placeholder={t.horse_colorPlaceholder} placeholderTextColor={C.faint} value={color} onChangeText={setColor} />

          {/* Pedigree */}
          <Text style={styles.section}>{t.horse_pedigreeLinks}</Text>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSirePicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_father}</Text>
              {sire
                ? <Text style={styles.pickerValue}>{sire.brand}{sire.name ? ` · ${sire.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>{t.select}</Text>}
            </View>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDamPicker(true)}>
            <View>
              <Text style={styles.pickerLabel}>{t.horse_mother}</Text>
              {dam
                ? <Text style={styles.pickerValue}>{dam.brand}{dam.name ? ` · ${dam.name}` : ''}</Text>
                : <Text style={styles.pickerPlaceholder}>{t.select}</Text>}
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
  section: { color: C.gold, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 5 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  modeBtnText: { fontSize: 14, fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  brandSlash: { color: C.gold, fontSize: 28, fontWeight: '800', paddingBottom: 12, paddingHorizontal: 2 },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: C.border },
  previewBox: { borderRadius: 12, padding: 14, marginBottom: 4, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewLabel: { fontSize: 12 },
  previewBrand: { fontSize: 26, fontWeight: '900', fontFamily: 'monospace', flex: 1 },
  previewYear: { fontSize: 13 },
  sexHint: { fontSize: 12, marginBottom: 8, marginTop: -2 },
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  sexBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
  sexBtnText: { fontSize: 15, fontWeight: '700' },
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
