import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
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
  const [horse, setHorse] = useState<Horse | null>(null);
  const [children, setChildren] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [horseId]);

  // Кнопки в хедере — ставим после загрузки лошади
  useEffect(() => {
    if (!horse) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 4 }}>
          <TouchableOpacity onPress={() => navigation.navigate('EditHorse', { horseId: horse.id })}>
            <Text style={{ fontSize: 20 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete}>
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [horse]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Жою',
      `${horse?.brand} лошадін жою керек пе?`,
      [
        { text: 'Жоқ', style: 'cancel' },
        {
          text: 'Жою', style: 'destructive',
          onPress: async () => {
            await supabase.from('shezhire_horses').delete().eq('id', horseId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [horse, horseId]);

  async function load() {
    setLoading(true);
    const [{ data: h }, { data: kids }] = await Promise.all([
      supabase.from('shezhire_horses').select('*, sire:sire_id(brand, name, sex), dam:dam_id(brand, name, sex)').eq('id', horseId).single(),
      supabase.from('shezhire_horses').select('*').or(`sire_id.eq.${horseId},dam_id.eq.${horseId}`).order('birth_year'),
    ]);
    if (h) setHorse(h as Horse);
    if (kids) setChildren(kids as Horse[]);
    setLoading(false);
  }

  if (loading) return <ActivityIndicator size="large" color="#e8b84b" style={{ flex: 1, backgroundColor: '#0f0f1a' }} />;
  if (!horse) return <View style={styles.container}><Text style={{ color: '#fff' }}>Табылмады</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Text style={styles.brand}>{horse.brand}</Text>
        <Text style={styles.sexLabel}>{horse.sex === 'м' ? '♂ Айғыр' : '♀ Бие'}</Text>
      </View>

      {horse.name && <Text style={styles.horseName}>{horse.name}</Text>}

      <View style={styles.infoGrid}>
        <InfoRow label="Туылған жылы" value={`${horse.birth_year} ж.`} />
        <InfoRow label="Нөмір" value={`${horse.sequence_no}`} />
        {horse.breed && <InfoRow label="Тұқымы" value={horse.breed} />}
        {horse.color && <InfoRow label="Түсі" value={horse.color} />}
      </View>

      <Text style={styles.section}>Шежіре</Text>
      <View style={styles.pedigreeBox}>
        <PedigreeLink
          label="Әкесі"
          horse={horse.sire as Horse | undefined}
          onPress={(id) => navigation.push('HorseDetail', { horseId: id })}
        />
        <PedigreeLink
          label="Шешесі"
          horse={horse.dam as Horse | undefined}
          onPress={(id) => navigation.push('HorseDetail', { horseId: id })}
        />
      </View>

      <TouchableOpacity
        style={styles.treeButton}
        onPress={() => navigation.navigate('ShireTree', { horseId: horse.id, horseBrand: horse.brand })}
      >
        <Text style={styles.treeButtonText}>🌳 Шежіре ағашы</Text>
      </TouchableOpacity>

      {children.length > 0 && (
        <>
          <Text style={styles.section}>Ұрпақтары ({children.length})</Text>
          {children.map(kid => (
            <TouchableOpacity
              key={kid.id}
              style={styles.kidCard}
              onPress={() => navigation.push('HorseDetail', { horseId: kid.id })}
            >
              <Text style={styles.kidBrand}>{kid.brand}</Text>
              <Text style={styles.kidSex}>{kid.sex === 'м' ? '♂' : '♀'}</Text>
              {kid.name && <Text style={styles.kidName}>{kid.name}</Text>}
              <Text style={styles.kidYear}>{kid.birth_year}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {horse.notes && (
        <>
          <Text style={styles.section}>Жазбалар</Text>
          <Text style={styles.notes}>{horse.notes}</Text>
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PedigreeLink({ label, horse, onPress }: { label: string; horse?: Horse | null; onPress: (id: string) => void }) {
  return (
    <View style={styles.pedigreeRow}>
      <Text style={styles.pedigreeLabel}>{label}:</Text>
      {horse ? (
        <TouchableOpacity onPress={() => onPress((horse as any).id ?? '')}>
          <Text style={styles.pedigreeLink}>{(horse as any).brand} {(horse as any).name ? `(${(horse as any).name})` : ''}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.pedigreeEmpty}>Белгісіз</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  brand: { color: '#e8b84b', fontSize: 36, fontWeight: 'bold', fontFamily: 'monospace' },
  sexLabel: { color: '#888', fontSize: 18 },
  horseName: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 16 },
  infoGrid: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#2a2a4a' },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  section: { color: '#e8b84b', fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  pedigreeBox: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  pedigreeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  pedigreeLabel: { color: '#888', fontSize: 15, width: 80 },
  pedigreeLink: { color: '#e8b84b', fontSize: 15, fontWeight: '600' },
  pedigreeEmpty: { color: '#555', fontSize: 15 },
  treeButton: { backgroundColor: '#1a2e1a', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#2a4a2a' },
  treeButtonText: { color: '#6aff6a', fontSize: 16, fontWeight: '600' },
  kidCard: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  kidBrand: { color: '#e8b84b', fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace' },
  kidSex: { fontSize: 16 },
  kidName: { color: '#fff', flex: 1 },
  kidYear: { color: '#888', fontSize: 13 },
  notes: { color: '#aaa', fontSize: 14, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, lineHeight: 20 },
});
