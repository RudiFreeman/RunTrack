import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLine,
  VictoryTheme,
  VictoryScatter,
} from 'victory-native';
import { getAllRuns } from '../services/storageService';
import { formatPace, formatDistance } from '../services/locationService';
import { SavedRun } from '../types';

// ─── Константы ────────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'all';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;
const MIN_RUNS_FOR_CHARTS = 3;

const CHART_THEME = {
  ...VictoryTheme.grayscale,
  axis: {
    ...VictoryTheme.grayscale.axis,
    style: {
      axis: { stroke: '#333333' },
      grid: { stroke: '#222222', strokeDasharray: '4,4' },
      tickLabels: { fill: '#666666', fontSize: 10, fontFamily: 'System' },
    },
  },
};

// ─── Вспомогательные функции ──────────────────────────────────────────────────

function startOfPeriod(period: Period): Date {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(0);
}

function filterRuns(runs: SavedRun[], period: Period): SavedRun[] {
  const from = startOfPeriod(period);
  return runs.filter((r) => new Date(r.date) >= from);
}

function buildDistanceByDay(runs: SavedRun[], period: Period): { x: string; y: number }[] {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : null;
  const map: Record<string, number> = {};

  if (days) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = 0;
    }
  }

  for (const run of runs) {
    const d = new Date(run.date);
    const key = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] ?? 0) + run.distance / 1000;
  }

  return Object.entries(map).map(([x, y]) => ({ x, y: parseFloat(y.toFixed(2)) }));
}

function buildPaceByRun(runs: SavedRun[]): { x: number; y: number }[] {
  const sorted = [...runs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const last = sorted.slice(-15);
  return last.map((r, i) => ({ x: i + 1, y: parseFloat((r.avgPace / 60).toFixed(2)) }));
}

function maxRunsPerWeek(runs: SavedRun[]): number {
  if (runs.length === 0) return 0;
  const map: Record<string, number> = {};
  for (const r of runs) {
    const d = new Date(r.date);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-${week}`;
    map[key] = (map[key] ?? 0) + 1;
  }
  return Math.max(...Object.values(map));
}

// ─── Компоненты ──────────────────────────────────────────────────────────────

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const { t } = useTranslation();
  const options: { label: string; value: Period }[] = [
    { label: t('stats.week'), value: 'week' },
    { label: t('stats.month'), value: 'month' },
    { label: t('stats.all_time'), value: 'all' },
  ];
  return (
    <View style={styles.periodRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.periodBtn, value === opt.value && styles.periodBtnActive]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.periodBtnText, value === opt.value && styles.periodBtnTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RecordCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.recordCard}>
      <Text style={styles.recordIcon}>{icon}</Text>
      <Text style={styles.recordValue}>{value}</Text>
      <Text style={styles.recordLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export function StatsScreen() {
  const { t } = useTranslation();
  const [allRuns, setAllRuns] = useState<SavedRun[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          setAllRuns(await getAllRuns());
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const filtered = useMemo(() => filterRuns(allRuns, period), [allRuns, period]);
  const distData = useMemo(() => buildDistanceByDay(filtered, period), [filtered, period]);
  const paceData = useMemo(() => buildPaceByRun(allRuns), [allRuns]);

  const bestPace = useMemo(
    () => allRuns.reduce(
      (best, r) => (r.avgPace > 0 && (best === 0 || r.avgPace < best) ? r.avgPace : best),
      0,
    ),
    [allRuns],
  );
  const longestRun = useMemo(
    () => allRuns.reduce((max, r) => Math.max(max, r.distance), 0),
    [allRuns],
  );
  const maxWeekly = useMemo(() => maxRunsPerWeek(allRuns), [allRuns]);

  const hasEnoughData = filtered.length >= MIN_RUNS_FOR_CHARTS;
  const hasAnyRun = allRuns.length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00E5A0" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>{t('stats.title')}</Text>

        <PeriodSelector value={period} onChange={setPeriod} />

        {!hasEnoughData ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>
              {t('stats.need_more_runs', { count: MIN_RUNS_FOR_CHARTS })}
            </Text>
            <Text style={styles.emptySubText}>
              {filtered.length === 0
                ? t('stats.no_runs_period')
                : t('stats.runs_progress', { current: filtered.length, total: MIN_RUNS_FOR_CHARTS })}
            </Text>
          </View>
        ) : (
          <>
            <SectionTitle title={t('stats.chart_distance')} />
            <View style={styles.chartCard}>
              <VictoryChart
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                theme={CHART_THEME}
                domainPadding={{ x: 12 }}
                padding={{ top: 16, bottom: 40, left: 44, right: 16 }}
              >
                <VictoryAxis
                  tickValues={distData
                    .filter((_, i) => i % Math.max(1, Math.floor(distData.length / 6)) === 0)
                    .map((d) => d.x)}
                  style={{
                    axis: { stroke: '#333333' },
                    tickLabels: { fill: '#666666', fontSize: 9, angle: -30 },
                    grid: { stroke: 'transparent' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: '#333333' },
                    tickLabels: { fill: '#666666', fontSize: 9 },
                    grid: { stroke: '#222222', strokeDasharray: '3,3' },
                  }}
                />
                <VictoryBar
                  data={distData}
                  style={{ data: { fill: ({ datum }) => (datum.y > 0 ? '#00E5A0' : '#1E1E1E'), opacity: 0.9 } }}
                  cornerRadius={{ top: 3 }}
                  barWidth={CHART_WIDTH / Math.max(distData.length * 1.6, 7)}
                  animate={{ duration: 400, onLoad: { duration: 400 } }}
                />
              </VictoryChart>
            </View>

            <SectionTitle title={t('stats.chart_pace')} />
            <View style={styles.chartCard}>
              <VictoryChart
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                theme={CHART_THEME}
                padding={{ top: 16, bottom: 40, left: 52, right: 16 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: '#333333' },
                    tickLabels: { fill: '#666666', fontSize: 9 },
                    grid: { stroke: 'transparent' },
                  }}
                  tickFormat={(t: number) => `#${t}`}
                />
                <VictoryAxis
                  dependentAxis
                  invertAxis
                  style={{
                    axis: { stroke: '#333333' },
                    tickLabels: { fill: '#666666', fontSize: 9 },
                    grid: { stroke: '#222222', strokeDasharray: '3,3' },
                  }}
                  tickFormat={(v: number) => {
                    const mins = Math.floor(v);
                    const secs = Math.round((v - mins) * 60);
                    return `${mins}:${String(secs).padStart(2, '0')}`;
                  }}
                />
                <VictoryLine
                  data={paceData}
                  style={{ data: { stroke: '#00E5A0', strokeWidth: 2 } }}
                  animate={{ duration: 400, onLoad: { duration: 400 } }}
                />
                <VictoryScatter data={paceData} size={4} style={{ data: { fill: '#00E5A0' } }} />
              </VictoryChart>
            </View>
          </>
        )}

        <SectionTitle title={t('stats.records_title')} />
        {!hasAnyRun ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>{t('stats.empty_records')}</Text>
          </View>
        ) : (
          <View style={styles.recordsGrid}>
            <RecordCard icon="🏆" label={t('stats.records_best_pace')} value={bestPace > 0 ? formatPace(bestPace) : '—'} />
            <RecordCard icon="📏" label={t('stats.records_longest')} value={longestRun > 0 ? formatDistance(longestRun) : '—'} />
            <RecordCard icon="🔥" label={t('stats.records_weekly')} value={String(maxWeekly)} />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#00E5A0', fontSize: 22, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },

  periodRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 3, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  periodBtnActive: { backgroundColor: '#00E5A0' },
  periodBtnText: { color: '#666666', fontSize: 12, fontWeight: '600' },
  periodBtnTextActive: { color: '#0D0D0D' },

  sectionTitle: { color: '#AAAAAA', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },

  chartCard: { backgroundColor: '#111111', borderRadius: 14, marginBottom: 20, overflow: 'hidden', alignItems: 'center' },

  emptyBlock: { backgroundColor: '#111111', borderRadius: 14, padding: 32, alignItems: 'center', marginBottom: 20 },
  emptyText: { color: '#555555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptySubText: { color: '#383838', fontSize: 12, marginTop: 6 },

  recordsGrid: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  recordCard: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14, alignItems: 'center' },
  recordIcon: { fontSize: 22, marginBottom: 6 },
  recordValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.3, marginBottom: 3 },
  recordLabel: { color: '#555555', fontSize: 9, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
});
