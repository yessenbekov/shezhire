import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT } from '../../i18n';
import { getAgeName, getAge } from '../../utils/horseAge';
import type { Horse } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HerdsStackParamList } from '../../navigation';

type Disposition = 'dead' | 'sold' | 'slaughtered' | 'other';
type Props = {
  navigation: NativeStackNavigationProp<HerdsStackParamList, 'HorseDetail'>;
  route: RouteProp<HerdsStackParamList, 'HorseDetail'>;
};

export default function HorseDetailScreen({ navigation, route }: Props) {
  const { horseId } = route.params;
  const { C, ageNames } = useTheme();
  const t = useT();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [children, setChildren] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispModal, setDispModal] = useState(false);
  const [dispChoice, setDispChoice] = useState<Disposition>('dead');
  const [dispNotes, setDispNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [horseId]);

  useEffect(() => {
    if (!horse) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 20, marginRight: 4 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditHorse', { horseId: horse.id })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: C.gold, fontSize: 15, fontWeight: '600' }}>{t.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: C.danger, fontSize: 15, fontWeight: '600' }}>{t.delete}</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [horse, C, t]);

  const confirmDelete = useCallback(() => {
    Alert.alert(t.delete, `${horse?.brand} ${t.horse_deleteConfirm}`, [
      { text: t.no, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('shezhire_horses').delete().eq('id', horseId);
        if (error) { Alert.alert(t.error, error.message); return; }
        navigation.goBack();
      }},
    ]);
  }, [horse, horseId, t]);

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

  async function restore() {
    Alert.alert(t.disp_restore, '', [
      { text: t.no, style: 'cancel' },
      { text: t.yes, onPress: async () => {
        await supabase.from('shezhire_horses').update({ disposition: 'alive', disposition_notes: null, disposed_at: null, died_at: null }).eq('id', horseId);
        load();
      }},
    ]);
  }

  async function applyDisposition() {
    setSaving(true);
    await supabase.from('shezhire_horses').update({
      disposition: dispChoice,
      disposition_notes: dispNotes.trim() || null,
      disposed_at: new Date().toISOString(),
      died_at: dispChoice === 'dead' ? new Date().toISOString() : null,
    }).eq('id', horseId);
    setSaving(false);
    setDispModal(false);
    setDispNotes('');
    load();
  }

  function openDispModal() {
    setDispChoice('dead');
    setDispNotes('');
    setDispModal(true);
  }

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!horse) return <View style={{ flex: 1, backgroundColor: C.bg }}><Text style={{ color: C.text, padding: 20 }}>{t.horse_notFound}</Text></View>;

  const isMale = horse.sex === 'м';
  const sexColor = isMale ? C.male : C.female;
  const sexBg = isMale ? C.maleBg : C.femaleBg;
  const sexBorder = isMale ? C.maleBorder : C.femaleBorder;
  const ageName = getAgeName(horse.birth_year, horse.sex, ageNames);
  const age = getAge(horse.birth_year);
  const disp = horse.disposition;
  const isAlive = !disp || disp === 'alive';

  const dispInfo: Record<Disposition, { label: string; color: string; icon: string }> = {
    dead: { label: t.disp_deadBanner, color: C.danger, icon: '🕊' },
    sold: { label: t.disp_soldBanner, color: C.male, icon: '💰' },
    slaughtered: { label: t.disp_slaughteredBanner, color: C.muted, icon: '🔪' },
    other: { label: t.disp_otherBanner, color: C.faint, icon: '📋' },
  };
  const currentDisp = disp && disp !== 'alive' ? dispInfo[disp] : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.hero, { backgroundColor: sexBg, borderBottomColor: sexBorder, opacity: isAlive ? 1 : 0.8 }]}>
        {currentDisp && (
          <View style={[styles.dispBanner, { backgroundColor: currentDisp.color + '22', borderColor: currentDisp.color + '66' }]}>
            <Text style={[styles.dispBannerText, { color: currentDisp.color }]}>
              {currentDisp.icon} {currentDisp.label}
              {horse.disposed_at ? ` · ${new Date(horse.disposed_at).getFullYear()}` : ''}
            </Text>
          </View>
        )}
        {horse.disposition_notes ? (
          <View style={[styles.dispNotesBanner, { backgroundColor: C.surface + 'CC', borderColor: C.border }]}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{horse.disposition_notes}</Text>
          </View>
        ) : null}
        <Text style={[styles.heroBrand, { color: sexColor }]}>{horse.brand}</Text>
        <View style={[styles.sexPill, { borderColor: sexBorder }]}>
          <Text style={[styles.sexPillText, { color: sexColor }]}>{isMale ? t.sex_male : t.sex_female}</Text>
        </View>
        {horse.name ? <Text style={[styles.heroName, { color: C.text }]}>{horse.name}</Text> : null}
        <Text style={[styles.heroMeta, { color: C.muted }]}>
          {horse.birth_year} {t.horse_born} · {t.horse_seqNo}{horse.sequence_no} · {age} {t.horse_age}
        </Text>
        <View style={[styles.ageNameBadge, { backgroundColor: sexBorder + '33', borderColor: sexBorder }]}>
          <Text style={[styles.ageNameText, { color: sexColor }]}>{ageName}</Text>
        </View>
      </View>

      <View style={{ padding: 20 }}>
        {(horse.breed || horse.color) ? (
          <View style={[styles.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            {horse.breed ? <InfoRow label={t.horse_breed} value={horse.breed} C={C} /> : null}
            {horse.color ? <InfoRow label={t.horse_color} value={horse.color} C={C} last /> : null}
          </View>
        ) : null}

        <Text style={[styles.section, { color: C.gold }]}>{t.horse_pedigree}</Text>
        <View style={[styles.pedigreeBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <PedigreeRow label={t.horse_father} horse={horse.sire as Horse | null} color={C.male} C={C} onPress={id => navigation.push('HorseDetail', { horseId: id })} />
          <View style={[styles.pedDivider, { backgroundColor: C.border }]} />
          <PedigreeRow label={t.horse_mother} horse={horse.dam as Horse | null} color={C.female} C={C} onPress={id => navigation.push('HorseDetail', { horseId: id })} unknown={t.unknown} />
        </View>

        <TouchableOpacity
          style={[styles.treeBtn, { borderColor: sexBorder, backgroundColor: C.surface }]}
          onPress={() => navigation.navigate('ShireTree', { horseId: horse.id, horseBrand: horse.brand })}
        >
          <Text style={[styles.treeBtnText, { color: sexColor }]}>{t.horse_tree}</Text>
        </TouchableOpacity>

        {children.length > 0 && (
          <>
            <Text style={[styles.section, { color: C.gold }]}>{t.horse_offspring} ({children.length})</Text>
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
            <Text style={[styles.section, { color: C.gold }]}>{t.horse_notes}</Text>
            <Text style={[styles.notes, { color: C.muted, backgroundColor: C.surface, borderColor: C.border }]}>{horse.notes}</Text>
          </>
        ) : null}

        {isAlive ? (
          <TouchableOpacity style={[styles.dispBtn, { borderColor: C.danger, backgroundColor: C.surface }]} onPress={openDispModal}>
            <Text style={[styles.dispBtnText, { color: C.danger }]}>{t.disp_markAs}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.dispBtn, { borderColor: C.success, backgroundColor: C.surface }]} onPress={restore}>
            <Text style={[styles.dispBtnText, { color: C.success }]}>{t.disp_restore}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Disposition Modal */}
      <Modal visible={dispModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDispModal(false)} />
          <View style={[styles.dispSheet, { backgroundColor: C.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: C.border }]} />
            <Text style={[styles.sheetTitle, { color: C.gold }]}>{t.disp_markAs}</Text>

            <View style={styles.dispOptions}>
              {(['dead', 'sold', 'slaughtered', 'other'] as Disposition[]).map(d => {
                const info = dispInfo[d];
                const active = dispChoice === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dispOption, { borderColor: active ? info.color : C.border, backgroundColor: active ? info.color + '18' : C.bg }]}
                    onPress={() => setDispChoice(d)}
                  >
                    <Text style={{ fontSize: 18 }}>{info.icon}</Text>
                    <Text style={[styles.dispOptionText, { color: active ? info.color : C.text }]}>{info.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sheetLabel, { color: C.muted }]}>{t.disp_notesHint}</Text>
            <TextInput
              style={[styles.sheetInput, { backgroundColor: C.bg, color: C.text, borderColor: C.border }]}
              placeholder={t.disp_notesHint}
              placeholderTextColor={C.faint}
              value={dispNotes}
              onChangeText={setDispNotes}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={[styles.sheetBtn, { flex: 1, backgroundColor: C.surfaceAlt }]} onPress={() => setDispModal(false)}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, { flex: 2, backgroundColor: dispInfo[dispChoice].color }]} onPress={applyDisposition} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{saving ? t.saving : t.disp_confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

function PedigreeRow({ label, horse, color, C, onPress, unknown }: { label: string; horse: Horse | null; color: string; C: any; onPress: (id: string) => void; unknown?: string }) {
  return (
    <View style={styles.pedRow}>
      <Text style={[styles.pedLabel, { color }]}>{label}</Text>
      {horse ? (
        <TouchableOpacity onPress={() => onPress((horse as any).id)}>
          <Text style={[styles.pedLink, { color }]}>{(horse as any).brand}{(horse as any).name ? ` · ${(horse as any).name}` : ''}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.pedEmpty, { color: C.faint }]}>{unknown ?? 'Белгісіз'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', borderBottomWidth: 1 },
  dispBanner: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 10, borderWidth: 1 },
  dispBannerText: { fontSize: 13, fontWeight: '600' },
  dispNotesBanner: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8, borderWidth: 1 },
  heroBrand: { fontSize: 52, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 2 },
  sexPill: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, borderWidth: 1, marginTop: 14, backgroundColor: 'rgba(128,128,128,0.06)' },
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
  dispBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1 },
  dispBtnText: { fontSize: 15, fontWeight: '600' },
  dispSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  dispOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dispOption: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minWidth: '47%' },
  dispOptionText: { fontSize: 14, fontWeight: '600' },
  sheetLabel: { fontSize: 12, marginBottom: 8 },
  sheetInput: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, minHeight: 72, textAlignVertical: 'top', marginBottom: 4 },
  sheetBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
});
