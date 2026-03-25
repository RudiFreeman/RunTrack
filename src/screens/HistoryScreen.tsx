import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { HistoryNavigationProp } from '../navigation/types';
import { SavedRun } from '../types';
import { getAllRuns, deleteRun } from '../services/storageService';
import { formatDistance, formatDuration, formatPace } from '../services/locationService';

// ─── Суммарная статистика ─────────────────────────────────────────────────────

function SummaryHeader({ runs }: { runs: SavedRun[] }) {
  const { t } = useTranslation();
  const totalKm = runs.reduce((s, r) => s + r.distance, 0) / 1000;
  const bestPace = runs.reduce(
    (best, r) => (r.avgPace > 0 && (best === 0 || r.avgPace < best) ? r.avgPace : best),
    0,
  );

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('history.title')}</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalKm.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>{t('history.total_km')}</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{runs.length}</Text>
          <Text style={styles.summaryLabel}>{t('history.runs_count')}</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatPace(bestPace)}</Text>
          <Text style={styles.summaryLabel}>{t('history.best_pace')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Карточка одного забега со свайпом на удаление ────────────────────────────

const SWIPE_THRESHOLD = -80;
const DELETE_WIDTH = 80;

function RunCard({
  run,
  onPress,
  onDelete,
}: {
  run: SavedRun;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx <= 0) {
          translateX.setValue(Math.max(g.dx, -DELETE_WIDTH));
          deleteOpacity.setValue(Math.min(-g.dx / DELETE_WIDTH, 1));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.timing(deleteOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  const date = new Date(run.date);
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.cardWrapper}>
      <Animated.View style={[styles.deleteBtn, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteBtnInner} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>{t('history.delete')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.cardInner}>
          <View style={styles.cardTop}>
            <Text style={styles.cardDate}>{dateStr}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{formatDistance(run.distance)}</Text>
              <Text style={styles.cardStatLabel}>{t('history.distance')}</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{formatDuration(run.duration)}</Text>
              <Text style={styles.cardStatLabel}>{t('history.time')}</Text>
            </View>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatValue}>{formatPace(run.avgPace)}</Text>
              <Text style={styles.cardStatLabel}>{t('history.pace')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HistoryNavigationProp>();
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllRuns();
      setRuns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRuns();
    }, [loadRuns]),
  );

  const handleDelete = useCallback((id: string) => {
    Alert.alert(t('history.delete_confirm_title'), t('history.delete_confirm_body'), [
      { text: t('history.cancel'), style: 'cancel' },
      {
        text: t('history.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRun(id);
          setRuns((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  }, [t]);

  const handlePress = useCallback(
    (run: SavedRun) => {
      navigation.navigate('Summary', {
        coordinates: run.coordinates,
        duration: run.duration,
        distance: run.distance,
        avgPace: run.avgPace,
        viewOnly: true,
        runDate: run.date,
        splits: run.splits,
        calories: run.calories,
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00E5A0" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={runs.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={runs.length > 0 ? <SummaryHeader runs={runs} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>{t('history.empty_line1')}</Text>
            <Text style={styles.emptyText}>{t('history.empty_line2')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RunCard
            run={item}
            onPress={() => handlePress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { color: '#00E5A0', fontSize: 22, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  summaryLabel: { color: '#666666', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 3 },
  summarySep: { width: 1, height: 32, backgroundColor: '#2A2A2A' },

  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBlock: { alignItems: 'center' },
  emptyText: { color: '#555555', fontSize: 16, lineHeight: 26 },

  cardWrapper: { marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  deleteBtn: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: DELETE_WIDTH, backgroundColor: '#FF4757',
    justifyContent: 'center', alignItems: 'center', borderRadius: 14,
  },
  deleteBtnInner: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 14 },
  cardInner: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardDate: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cardTime: { color: '#555555', fontSize: 13 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  cardStat: { alignItems: 'center', flex: 1 },
  cardStatValue: { color: '#00E5A0', fontSize: 15, fontWeight: '700' },
  cardStatLabel: { color: '#555555', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 3 },
});
