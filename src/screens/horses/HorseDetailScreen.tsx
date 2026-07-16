import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { getAgeName, getAge } from '../../utils/horseAge';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'HorseDetail'>;
  route: RouteProp<HerdsStackParamList, 'HorseDetail'>;
};

export default function HorseDetailScreen({ navigation, route }: Props) {
  const { horseId } = route.params;
  const { C, ageNames } = useTheme();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [children, setChildren] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [horseId]);

  useEffect(() => {
    if (!horse) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 20, marginRight: 4 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditHorse', { horseId: horse.id })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: C.gold, fontSize: 15, fontWeight: '600' }}>Өзгерту</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: C.danger, fontSize: 15, fontWeight: '600' }}>Жою</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [horse, C]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Жою', `${horse?.brand} лошадін жою керек пе?`, [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Жою', style: 'destructive', onPress: async () => {
        await supabase.from('shezhire_horses').delete().eq('id', horseId);
        navigation.goBack();
      }},
    ]);
  }, [horse, horseId]);

  async function load() {
    setLoading(true);
    const { data: h } = await supabase.from('shezhire_horses').select('*').eq('id', horseId).single();
    if (!h) { setLoading(false); return; }

    const [{ data: sire }, { data: dam }, { data: kids }] = await Promise.all([
      h.sire_id ? supabase.from('shezhire_horses').select('id, brand, name, sex').eq('id', h.sire_id).single() : Promise.resolve({ data: null }),
      h.dam_id ? supabase.from('shezhire_horses').select('id, brand, name, sex').eq('id', h.dam_id).single() : Promise.resolve({ data: null }),
      supabase.from('shezhire_horses').select('*').or(`sire_id.eq.${horseId},dam_id.eq.${horseId}`).order('birth_year'),
    ]);

    setHorse({ ...h, sire: sire ?? null, dam: dam ?? null } as Horse);
    setChildren((kids ?? []) as Horse[]);
    setLoading(false);
  }

  async function markDead() {
    if (horse?.died_at) {
      Alert.alert('Тірілту', 'Лошадін тірі деп белгілеу керек пе?', [
        { text: 'Жоқ', style: 'cancel' },
        { text: 'Иә', onPress: async () => {
          await supabase.from('shezhire_horses').update({ died_at: null }).eq('id', horseId);
          load();
        }},
      ]);
      return;
    }
    Alert.alert('Қайтыс болды', `${horse?.brand} лошадін қайтыс болды деп белгілеу керек пе?`, [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Иә', style: 'destructive', onPress: async () => {
        await supabase.from('shezhire_horses').update({ died_at: new Date().toISOString() }).eq('id', horseId);
        load();
      }},
    ]);
  }

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!horse) return <View style={{ flex: 1, backgroundColor: C.bg }}><Text style={{ color: C.text, padding: 20 }}>Табылмады</Text></View>;

  const isMale = horse.sex === 'м';
  const sexColor = isMale ? C.male : C.female;
  const sexBg = isMale ? C.maleBg : C.femaleBg;
  const sexBorder = isMale ? C.maleBorder : C.femaleBorder;
  const ageName = getAgeName(horse.birth_year, horse.sex, ageNames);
  const age = getAge(horse.birth_year);
  const isDead = !!horse.died_at;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.hero, { backgroundColor: sexBg, borderBottomColor: sexBorder, opacity: isDead ? 0.75 : 1 }]}>
        {isDead && <View style={styles.deadBanner}><Text style={styles.deadText}>🕊 Қайтыс болды · {new Date(horse.died_at!).getFullYear()}</Text></View>}
        <Text style={[styles.heroBrand, { color: sexColor }]}>{horse.brand}</Text>
        <View style={[styles.sexPill, { borderColor: sexBorder }]}>
          <Text style={[styles.sexPillText, { color: sexColor }]}>{isMale ? '♂ Айғыр' : '♀ Бие'}</Text>
        </View>
        {horse.name ? <Text style={[styles.heroName, { color: C.text }]}>{horse.name}</Text> : null}
        <Text style={[styles.heroMeta, { color: C.muted }]}>
          {horse.birth_year} жылы туылған · №{horse.sequence_no} · {age} жас
        </Text>
        <View style={[styles.ageNameBadge, { backgroundColor: sexBorder + '33', borderColor: sexBorder }]}>
          <Text style={[styles.ageNameText, { color: sexColor }]}>{ageName}</Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        {(horse.breed || horse.color) ? (
          <View style={[styles.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            {horse.breed ? <InfoRow label="Тұқымы" value={horse.breed} C={C} /> : null}
            {horse.color ? <InfoRow label="Түсі" value={horse.color} C={C} last /> : null}
          </View>
        ) : null}

        <Text style={[styles.section, { color: C.gold }]}>Шежіре</Text>
        <View style={[styles.pedigreeBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <PedigreeRow label="♂ Әкесі" horse={horse.sire as Horse | null} color={C.male} C={C} onPress={id => navigation.push('HorseDetail', { horseId: id })} />
          <View style={[styles.pedDivider, { backgroundColor: C.border }]} />
          <PedigreeRow label="♀ Шешесі" horse={horse.dam as Horse | null} color={C.female} C={C} onPress={id => navigation.push('HorseDetail', { horseId: id })} />
        </View>

        <TouchableOpacity
          style={[styles.treeBtn, { borderColor: sexBorder, backgroundColor: C.surface }]}
          onPress={() => navigation.navigate('ShireTree', { horseId: horse.id, horseBrand: horse.brand })}
        >
          <Text style={[styles.treeBtnText, { color: sexColor }]}>🌳 Шежіре ағашы</Text>
        </TouchableOpacity>

        {children.length > 0 && (
          <>
            <Text style={[styles.section, { color: C.gold }]}>Ұрпақтары ({children.length})</Text>
            {children.map(kid => {
              const kidMale = kid.sex === 'м';
              return (
                <TouchableOpacity
                  key={kid.id}
                  style={[styles.kidCard, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: kidMale ? C.maleBorder : C.femaleBorder }]}
                  onPress={() => navigation.push('HorseDetail', { horseId: kid.id })}
                >
                  <Text style={[styles.kidBrand, { color: kidMale ? C.male : C.female }]}>{kid.brand}</Text>
                  <Text style={[styles.kidSex, { color: kidMale ? C.male : C.female }]}>{kidMale ? '♂' : '♀'}</Text>
                  <Text style={[styles.kidAgeName, { color: C.muted }]}>{getAgeName(kid.birth_year, kid.sex, ageNames)}</Text>
                  {kid.name ? <Text style={[styles.kidName, { color: C.text }]}>{kid.name}</Text> : null}
                  <Text style={[styles.kidArrow, { color: C.border }]}>›</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {horse.notes ? (
          <>
            <Text style={[styles.section, { color: C.gold }]}>Жазбалар</Text>
            <Text style={[styles.notes, { color: C.muted, backgroundColor: C.surface, borderColor: C.border }]}>{horse.notes}</Text>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.deadBtn, { borderColor: isDead ? C.success : C.danger, backgroundColor: C.surface }]}
          onPress={markDead}
        >
          <Text style={[styles.deadBtnText, { color: isDead ? C.success : C.danger }]}>
            {isDead ? '✓ Тірі деп белгілеу' : '🕊 Қайтыс болды деп белгілеу'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, C, last }: { label: string; value: string; C: any; last?: boolean }) {
  return (
    <View style={[styles.infoRow, { borderColor: C.border }, last && { borderBottomWidth: 0 }]}>
      <Text style={[styles.infoLabel, { color: C.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: C.text }]}>{value}</Text>
    </View>
  );
}

function PedigreeRow({ label, horse, color, C, onPress }: { label: string; horse: Horse | null; color: string; C: any; onPress: (id: string) => void }) {
  return (
    <View style={styles.pedRow}>
      <Text style={[styles.pedLabel, { color }]}>{label}</Text>
      {horse ? (
        <TouchableOpacity onPress={() => onPress((horse as any).id)}>
          <Text style={[styles.pedLink, { color }]}>{(horse as any).brand}{(horse as any).name ? ` · ${(horse as any).name}` : ''}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.pedEmpty, { color: C.faint }]}>Белгісіз</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', borderBottomWidth: 1 },
  deadBanner: { backgroundColor: 'rgba(200,74,74,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12 },
  deadText: { color: '#C84A4A', fontSize: 13, fontWeight: '600' },
  heroBrand: { fontSize: 52, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  sexPill: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, borderWidth: 1, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  sexPillText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  heroName: { fontSize: 22, fontWeight: '600', marginTop: 14 },
  heroMeta: { fontSize: 13, marginTop: 6 },
  ageNameBadge: { marginTop: 10, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1 },
  ageNameText: { fontSize: 16, fontWeight: '700' },
  infoBox: { borderRadius: 14, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  section: { fontSize: 11, fontWeight: '700', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  pedigreeBox: { borderRadius: 14, paddingHorizontal: 16, marginBottom: 14, borderWidth: 1 },
  pedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  pedDivider: { height: 1 },
  pedLabel: { fontSize: 13, fontWeight: '600' },
  pedLink: { fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  pedEmpty: { fontSize: 15 },
  treeBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1 },
  treeBtnText: { fontSize: 16, fontWeight: '600' },
  kidCard: { borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderLeftWidth: 4 },
  kidBrand: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  kidSex: { fontSize: 14 },
  kidAgeName: { fontSize: 12 },
  kidName: { flex: 1, fontSize: 14 },
  kidArrow: { fontSize: 20 },
  notes: { fontSize: 14, borderRadius: 12, padding: 14, lineHeight: 22, borderWidth: 1 },
  deadBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, borderWidth: 1 },
  deadBtnText: { fontSize: 15, fontWeight: '600' },
});
