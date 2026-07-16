import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface Stats {
  total: number;
  alive: number;
  dead: number;
  male: number;
  female: number;
  byBirthYear: Record<number, { total: number; male: number; female: number }>;
  byDeathYear: Record<number, number>;
}

export default function ReportsScreen() {
  const { C } = useTheme();
  const s = makeStyles(C);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  async function loadStats() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('shezhire_horses')
      .select('sex, birth_year, died_at')
      .eq('owner_id', user.id);

    if (!data) { setLoading(false); return; }

    const total = data.length;
    const dead = data.filter(h => h.died_at).length;
    const alive = total - dead;
    const male = data.filter(h => h.sex === 'м').length;
    const female = data.filter(h => h.sex === 'ж').length;

    const byBirthYear: Stats['byBirthYear'] = {};
    const byDeathYear: Stats['byDeathYear'] = {};

    for (const h of data) {
      const by = h.birth_year;
      if (!byBirthYear[by]) byBirthYear[by] = { total: 0, male: 0, female: 0 };
      byBirthYear[by].total++;
      if (h.sex === 'м') byBirthYear[by].male++;
      else byBirthYear[by].female++;

      if (h.died_at) {
        const dy = new Date(h.died_at).getFullYear();
        byDeathYear[dy] = (byDeathYear[dy] ?? 0) + 1;
      }
    }

    setStats({ total, alive, dead, male, female, byBirthYear, byDeathYear });
    setLoading(false);
  }

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;

  if (!stats || stats.total === 0) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>Мәліметтер жоқ</Text>
        <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Лошадь қосқаннан кейін статистика пайда болады</Text>
      </View>
    );
  }

  const birthYears = Object.keys(stats.byBirthYear).map(Number).sort((a, b) => b - a);
  const deathYears = Object.keys(stats.byDeathYear).map(Number).sort((a, b) => b - a);
  const maxBirths = Math.max(...birthYears.map(y => stats.byBirthYear[y].total));

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Общая сводка */}
      <Text style={s.section}>Жалпы</Text>
      <View style={s.summaryGrid}>
        <StatTile label="Барлығы" value={stats.total} color={C.gold} C={C} />
        <StatTile label="Тірі" value={stats.alive} color={C.success} C={C} />
        <StatTile label="Қайтыс" value={stats.dead} color={C.danger} C={C} />
      </View>
      <View style={s.summaryGrid}>
        <StatTile label="♂ Айғыр" value={stats.male} color={C.male} C={C} />
        <StatTile label="♀ Бие" value={stats.female} color={C.female} C={C} />
      </View>

      {/* Туылғандар по годам */}
      <Text style={s.section}>Туылғандар жыл бойынша</Text>
      <View style={s.card}>
        {birthYears.map(year => {
          const d = stats.byBirthYear[year];
          const barW = maxBirths > 0 ? (d.total / maxBirths) * 100 : 0;
          return (
            <View key={year} style={s.yearRow}>
              <Text style={s.yearLabel}>{year}</Text>
              <View style={s.barWrap}>
                <View style={[s.bar, { width: `${barW}%` as any, backgroundColor: C.gold }]} />
              </View>
              <Text style={s.yearCount}>{d.total}</Text>
              <Text style={s.yearSub}> ♂{d.male} ♀{d.female}</Text>
            </View>
          );
        })}
      </View>

      {/* Қайтыс болғандар */}
      {deathYears.length > 0 && (
        <>
          <Text style={s.section}>Қайтыс болғандар жыл бойынша</Text>
          <View style={s.card}>
            {deathYears.map(year => (
              <View key={year} style={s.yearRow}>
                <Text style={s.yearLabel}>{year}</Text>
                <View style={s.barWrap}>
                  <View style={[s.bar, { width: `${(stats.byDeathYear[year] / stats.dead) * 100}%` as any, backgroundColor: C.danger }]} />
                </View>
                <Text style={[s.yearCount, { color: C.danger }]}>{stats.byDeathYear[year]}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatTile({ label, value, color, C }: { label: string; value: number; color: string; C: any }) {
  return (
    <View style={[{ flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 16, margin: 4, alignItems: 'center', borderWidth: 1, borderColor: C.border }]}>
      <Text style={{ color, fontSize: 32, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    section: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    summaryGrid: { flexDirection: 'row', marginHorizontal: -4 },
    card: { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 4, borderWidth: 1, borderColor: C.border },
    yearRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    yearLabel: { color: C.text, fontSize: 14, fontWeight: '700', width: 44 },
    barWrap: { flex: 1, height: 10, backgroundColor: C.surfaceAlt, borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
    bar: { height: 10, borderRadius: 5 },
    yearCount: { color: C.gold, fontSize: 14, fontWeight: '700', width: 28, textAlign: 'right' },
    yearSub: { color: C.muted, fontSize: 12, width: 72 },
  });
}
