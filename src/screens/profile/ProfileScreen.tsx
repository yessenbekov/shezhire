import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT, type Lang } from '../../i18n';
import { DEFAULT_AGE_NAMES } from '../../utils/horseAge';

const AGE_SLOTS = [
  { key: '0' }, { key: '1' }, { key: '2' }, { key: '3' },
  { key: '4' }, { key: '5' }, { key: '6' }, { key: '6f' },
];

export default function ProfileScreen() {
  const { C, mode, toggleTheme, ageNames, saveAgeNames, lang, setLang } = useTheme();
  const t = useT();
  const s = makeStyles(C);

  const [email, setEmail] = useState('');
  const [localNames, setLocalNames] = useState<Record<string, string>>(ageNames);
  const [editingNames, setEditingNames] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (user) setEmail(user.email ?? ''); }); }, []);
  useEffect(() => { setLocalNames(ageNames); }, [ageNames]);

  async function handleSaveNames() {
    setSaving(true);
    await saveAgeNames(localNames);
    setSaving(false);
    setEditingNames(false);
  }

  function handleSignOut() {
    Alert.alert(t.profile_signOut, t.profile_signOutConfirm, [
      { text: t.no, style: 'cancel' },
      { text: t.profile_signOut, style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  const ageSlotLabels: Record<string, string> = {
    '0': t.age_slot_0, '1': t.age_slot_1, '2': t.age_slot_2, '3': t.age_slot_3,
    '4': t.age_slot_4, '5': t.age_slot_5, '6': t.age_slot_6m, '6f': t.age_slot_6f,
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={s.card}>
        <Text style={s.avatarText}>👤</Text>
        <Text style={s.email}>{email}</Text>
      </View>

      {/* Language */}
      <Text style={s.section}>{t.profile_language}</Text>
      <View style={s.langRow}>
        {(['kk', 'ru'] as Lang[]).map(l => (
          <TouchableOpacity
            key={l}
            style={[s.langBtn, { borderColor: lang === l ? C.gold : C.border, backgroundColor: lang === l ? C.gold + '18' : C.surface }]}
            onPress={() => setLang(l)}
          >
            <Text style={[s.langBtnText, { color: lang === l ? C.gold : C.muted }]}>{t[`lang_${l}` as 'lang_kk' | 'lang_ru']}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Theme */}
      <Text style={s.section}>{t.profile_theme}</Text>
      <View style={s.row}>
        <Text style={s.rowLabel}>{mode === 'dark' ? t.profile_dark : t.profile_light}</Text>
        <Switch value={mode === 'dark'} onValueChange={toggleTheme} trackColor={{ true: C.gold, false: C.border }} thumbColor={C.surface} />
      </View>

      {/* Age names */}
      <View style={s.sectionRow}>
        <Text style={s.section}>{t.profile_ageNames}</Text>
        <TouchableOpacity onPress={() => setEditingNames(v => !v)}>
          <Text style={s.editBtn}>{editingNames ? t.close : t.edit}</Text>
        </TouchableOpacity>
      </View>

      {!editingNames ? (
        <View style={s.card}>
          {AGE_SLOTS.map(({ key }) => (
            <View key={key} style={s.nameRow}>
              <Text style={s.nameAge}>{ageSlotLabels[key]}</Text>
              <Text style={s.nameVal}>{localNames[key] ?? DEFAULT_AGE_NAMES[key] ?? '—'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.card}>
          {AGE_SLOTS.map(({ key }) => (
            <View key={key} style={s.nameRow}>
              <Text style={[s.nameAge, { flex: 1 }]}>{ageSlotLabels[key]}</Text>
              <TextInput
                style={s.nameInput}
                value={localNames[key] ?? ''}
                onChangeText={val => setLocalNames(prev => ({ ...prev, [key]: val }))}
                placeholder={DEFAULT_AGE_NAMES[key] ?? ''}
                placeholderTextColor={C.faint}
              />
            </View>
          ))}
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveNames} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? t.saving : t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>{t.profile_signOut}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['C']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    card: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    avatarText: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
    email: { color: C.text, fontSize: 16, textAlign: 'center', fontWeight: '600' },
    section: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 8 },
    editBtn: { color: C.gold, fontSize: 14, fontWeight: '600' },
    langRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    langBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
    langBtnText: { fontSize: 15, fontWeight: '700' },
    row: { backgroundColor: C.surface, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    rowLabel: { color: C.text, fontSize: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: C.border },
    nameAge: { color: C.muted, fontSize: 13, width: 140 },
    nameVal: { color: C.text, fontSize: 15, fontWeight: '600' },
    nameInput: { backgroundColor: C.bg, color: C.text, borderRadius: 8, padding: 8, fontSize: 14, borderWidth: 1, borderColor: C.border, width: 120, textAlign: 'right' },
    saveBtn: { backgroundColor: C.gold, borderRadius: 12, padding: 14, alignItems: 'center' },
    saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
    signOutBtn: { marginTop: 24, backgroundColor: C.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.danger },
    signOutText: { color: C.danger, fontSize: 16, fontWeight: '600' },
  });
}
