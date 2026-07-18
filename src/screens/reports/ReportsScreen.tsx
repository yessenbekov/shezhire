import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useT, type Lang } from '../../i18n';

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
  const { C, lang } = useTheme();
  const t = useT();
  const s = useMemo(() => makeStyles(C), [C]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  async function loadStats() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('shezhire_horses')
      .select('sex, birth_year, died_at, disposition, disposed_at')
      .eq('owner_id', user.id);

    if (!data) { setLoading(false); return; }

    const total = data.length;
    const dead = data.filter(h => (h.disposition && h.disposition !== 'alive') || !!h.died_at).length;
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

  async function shareAsPDF() {
    if (!stats) return;
    setPdfLoading(true);
    try {
      const html = buildReportHTML(stats, t, lang);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: t.report_pdf,
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert(t.error, e?.message ?? t.report_pdfError);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex: 1, backgroundColor: C.bg }} />;

  if (!stats || stats.total === 0) {
    return <EmptyState icon="tree" title={t.report_noData} subtitle={t.report_noDataHint} />;
  }

  const birthYears = Object.keys(stats.byBirthYear).map(Number).sort((a, b) => b - a);
  const deathYears = Object.keys(stats.byDeathYear).map(Number).sort((a, b) => b - a);
  const maxBirths = Math.max(...birthYears.map(y => stats.byBirthYear[y].total));
  const maxDeaths = deathYears.length > 0 ? Math.max(...deathYears.map(y => stats.byDeathYear[y])) : 1;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

      {/* PDF Share button */}
      <TouchableOpacity style={s.pdfBtn} onPress={shareAsPDF} disabled={pdfLoading}>
        <Text style={s.pdfBtnIcon}>📄</Text>
        <Text style={s.pdfBtnText}>{pdfLoading ? t.report_pdfLoading : t.report_pdf}</Text>
      </TouchableOpacity>

      {/* Общая сводка */}
      <Text style={s.section}>{t.report_general}</Text>
      <View style={s.summaryGrid}>
        <StatTile label={t.report_total} value={stats.total} color={C.gold} C={C} />
        <StatTile label={t.report_alive} value={stats.alive} color={C.success} C={C} />
        <StatTile label={t.report_dead} value={stats.dead} color={C.danger} C={C} />
      </View>
      <View style={s.summaryGrid}>
        <StatTile label={t.report_stallions} value={stats.male} color={C.male} C={C} />
        <StatTile label={t.report_mares} value={stats.female} color={C.female} C={C} />
      </View>

      <Text style={s.section}>{t.report_births}</Text>
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
          <Text style={s.section}>{t.report_deaths}</Text>
          <View style={s.card}>
            {deathYears.map(year => (
              <View key={year} style={s.yearRow}>
                <Text style={s.yearLabel}>{year}</Text>
                <View style={s.barWrap}>
                  <View style={[s.bar, { width: `${(stats.byDeathYear[year] / maxDeaths) * 100}%` as any, backgroundColor: C.danger }]} />
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
    <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 16, margin: 4, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
      <Text style={{ color, fontSize: 32, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    pdfBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.surface, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: C.border, marginBottom: 4, gap: 10,
    },
    pdfBtnIcon: { fontSize: 20 },
    pdfBtnText: { color: C.gold, fontSize: 15, fontWeight: '700' },
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

function buildReportHTML(stats: Stats, t: ReturnType<typeof useT>, lang: Lang): string {
  const now = new Date();
  const locale = lang === 'ru' ? 'ru-RU' : 'kk-KZ';
  const dateStr = now.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  const birthYears = Object.keys(stats.byBirthYear).map(Number).sort((a, b) => b - a);
  const deathYears = Object.keys(stats.byDeathYear).map(Number).sort((a, b) => b - a);

  const birthRows = birthYears.map(y => {
    const d = stats.byBirthYear[y];
    const pct = stats.total > 0 ? Math.round((d.total / stats.total) * 100) : 0;
    return `
      <tr>
        <td>${y}</td>
        <td style="text-align:center">${d.total}</td>
        <td style="text-align:center; color:#1A6A8A">♂ ${d.male}</td>
        <td style="text-align:center; color:#8A1A5A">♀ ${d.female}</td>
        <td>
          <div style="background:#e8e0d0;border-radius:4px;height:12px;overflow:hidden">
            <div style="background:#9A6E14;height:12px;width:${pct}%;border-radius:4px"></div>
          </div>
        </td>
      </tr>`;
  }).join('');

  const deathSection = deathYears.length > 0 ? `
    <h2 style="color:#9A6E14;font-size:14px;margin-top:28px;margin-bottom:10px;text-transform:uppercase;letter-spacing:2px">
      ${t.report_deaths}
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f5efe6;color:#7A5A40">
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #ddd0b8">${t.report_year}</th>
          <th style="text-align:center;padding:8px 10px;border-bottom:1px solid #ddd0b8">${t.report_count}</th>
        </tr>
      </thead>
      <tbody>
        ${deathYears.map(y => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #ece4d8">${y}</td>
            <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #ece4d8;color:#C84A4A;font-weight:700">${stats.byDeathYear[y]}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="kk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1A0808; background: #fff; padding: 32px; font-size: 13px; }
    .header { border-bottom: 2px solid #9A6E14; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .logo { font-size: 28px; font-weight: 900; color: #9A6E14; letter-spacing: 3px; }
    .logo-sub { font-size: 11px; color: #7A5A40; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .date { font-size: 12px; color: #7A5A40; text-align: right; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; }
    .tile { flex: 1; border: 1px solid #ddd0b8; border-radius: 10px; padding: 14px 10px; text-align: center; background: #faf6f0; }
    .tile-num { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .tile-label { font-size: 10px; color: #7A5A40; text-transform: uppercase; letter-spacing: 1px; }
    h2 { color: #9A6E14; font-size: 14px; margin-top: 28px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f5efe6; color: #7A5A40; }
    th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd0b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 10px; border-bottom: 1px solid #ece4d8; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd0b8; font-size: 11px; color: #a08060; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">🐎 Шежіре</div>
      <div class="logo-sub">Жылқы тегінің кітабы</div>
    </div>
    <div class="date">
      <div style="font-weight:600;margin-bottom:2px">${t.report_dateLabel}</div>
      <div>${dateStr}</div>
    </div>
  </div>

  <div class="summary">
    <div class="tile">
      <div class="tile-num" style="color:#9A6E14">${stats.total}</div>
      <div class="tile-label">${t.report_total}</div>
    </div>
    <div class="tile">
      <div class="tile-num" style="color:#2A9060">${stats.alive}</div>
      <div class="tile-label">${t.report_alive}</div>
    </div>
    <div class="tile">
      <div class="tile-num" style="color:#C84A4A">${stats.dead}</div>
      <div class="tile-label">${t.report_dead}</div>
    </div>
    <div class="tile">
      <div class="tile-num" style="color:#1A6A8A">♂ ${stats.male}</div>
      <div class="tile-label">${t.report_stallions.replace('♂ ', '')}</div>
    </div>
    <div class="tile">
      <div class="tile-num" style="color:#8A1A5A">♀ ${stats.female}</div>
      <div class="tile-label">${t.report_mares.replace('♀ ', '')}</div>
    </div>
  </div>

  <h2>${t.report_births}</h2>
  <table>
    <thead>
      <tr>
        <th>${t.report_year}</th>
        <th style="text-align:center">${t.report_total}</th>
        <th style="text-align:center">${t.report_stallions.replace('♂ ', '♂ ')}</th>
        <th style="text-align:center">${t.report_mares.replace('♀ ', '♀ ')}</th>
        <th style="min-width:120px">${t.report_count}</th>
      </tr>
    </thead>
    <tbody>${birthRows}</tbody>
  </table>

  ${deathSection}

  <div class="footer">Шежіре қосымшасымен жасалды · shezhire.app</div>
</body>
</html>`;
}
