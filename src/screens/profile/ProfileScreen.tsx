import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, TextInput,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_AGE_NAMES } from '../../utils/horseAge';

const AGE_SLOTS = [
  { key: '0', label: '0 жас (Жылқы құлыны)' },
  { key: '1', label: '1 жас' },
  { key: '2', label: '2 жас' },
  { key: '3', label: '3 жас' },
  { key: '4', label: '4 жас' },
  { key: '5', label: '5 жас' },
  { key: '6', label: '6+ жас (♂)' },
  { key: '6f', label: '6+ жас (♀)' },
];

export default function ProfileScreen() {
  const { C, mode, toggleTheme, ageNames, saveAgeNames } = useTheme();
  const s = makeStyles(C);

  const [email, setEmail] = useState('');
  const [localNames, setLocalNames] = useState<Record<string, string>>(ageNames);
  const [editingNames, setEditingNames] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '');
    });
  }, []);

  useEffect(() => { setLocalNames(ageNames); }, [ageNames]);

  async function handleSaveNames() {
    setSaving(true);
    await saveAgeNames(localNames);
    setSaving(false);
    setEditingNames(false);
  }

  async function handleSignOut() {
    Alert.alert('Шығу', 'Жүйеден шығасыз ба?', [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Шығу', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* User info */}
      <View style={s.card}>
        <Text style={s.avatarText}>👤</Text>
        <Text style={s.email}>{email}</Text>
      </View>

      {/* Theme toggle */}
      <Text style={s.section}>Тема</Text>
      <View style={s.row}>
        <Text style={s.rowLabel}>{mode === 'dark' ? '🌙 Қараңғы тема' : '☀️ Жарық тема'}</Text>
        <Switch
          value={mode === 'light'}
          onValueChange={toggleTheme}
          trackColor={{ true: C.gold, false: C.border }}
          thumbColor={C.surface}
        />
      </View>

      {/* Age names */}
      <View style={s.sectionRow}>
        <Text style={s.section}>Жас атаулары</Text>
        <TouchableOpacity onPress={() => setEditingNames(v => !v)}>
          <Text style={s.editBtn}>{editingNames ? 'Жабу' : 'Өзгерту'}</Text>
        </TouchableOpacity>
      </View>

      {!editingNames ? (
        <View style={s.card}>
          {AGE_SLOTS.map(({ key, label }) => (
            <View key={key} style={s.nameRow}>
              <Text style={s.nameAge}>{label}</Text>
              <Text style={s.nameVal}>{localNames[key] ?? DEFAULT_AGE_NAMES[key] ?? '—'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.card}>
          {AGE_SLOTS.map(({ key, label }) => (
            <View key={key} style={s.nameRow}>
              <Text style={[s.nameAge, { flex: 1 }]}>{label}</Text>
              <TextInput
                style={s.nameInput}
                value={localNames[key] ?? ''}
                onChangeText={val => setLocalNames(prev => ({ ...prev, [key]: val }))}
                placeholder={DEFAULT_AGE_NAMES[key] ?? ''}
                placeholderTextColor={C.faint}
              />
            </View>
          ))}
          <View style={s.saveBtnRow}>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSaveNames}
              disabled={saving}
            >
              <Text style={s.saveBtnText}>{saving ? 'Сақталуда...' : 'Сақтау'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sign out */}
      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>Жүйеден шығу</Text>
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
    row: { backgroundColor: C.surface, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
    rowLabel: { color: C.text, fontSize: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: C.border },
    nameAge: { color: C.muted, fontSize: 13, width: 140 },
    nameVal: { color: C.text, fontSize: 15, fontWeight: '600' },
    nameInput: { backgroundColor: C.bg, color: C.text, borderRadius: 8, padding: 8, fontSize: 14, borderWidth: 1, borderColor: C.border, width: 120, textAlign: 'right' },
    saveBtnRow: { marginTop: 12 },
    saveBtn: { backgroundColor: C.gold, borderRadius: 12, padding: 14, alignItems: 'center' },
    saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
    signOutBtn: { marginTop: 24, backgroundColor: C.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.danger },
    signOutText: { color: C.danger, fontSize: 16, fontWeight: '600' },
  });
}
