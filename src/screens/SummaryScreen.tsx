import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SummaryRouteProp, SummaryNavigationProp } from '../navigation/types';
import { SavedRun, Split } from '../types';
import {
  formatDistance,
  formatDuration,
  formatPace,
  calculateSplits,
  calculateCalories,
} from '../services/locationService';
import { saveRun } from '../services/storageService';

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SplitRow({ split, isLast }: { split: Split; isLast: boolean }) {
  return (
    <View style={[styles.splitRow, isLast && styles.splitRowLast]}>
      <Text style={styles.splitKm}>{split.km} км</Text>
      <Text style={styles.splitPace}>{formatPace(split.pace)}</Text>
      <Text style={styles.splitTime}>{formatDuration(split.duration)}</Text>
    </View>
  );
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export function SummaryScreen() {
  const route = useRoute<SummaryRouteProp>();
  const navigation = useNavigation<SummaryNavigationProp>();
  const {
    coordinates,
    duration,
    distance,
    avgPace,
    viewOnly = false,
    runDate,
    splits: savedSplits,
    calories: savedCalories,
  } = route.params;

  const [saving, setSaving] = useState(false);

  // Используем готовые данные из истории или вычисляем на месте
  const splits = useMemo(
    () => savedSplits ?? calculateSplits(coordinates),
    [savedSplits, coordinates],
  );
  const calories = useMemo(
    () => savedCalories ?? calculateCalories(distance),
    [savedCalories, distance],
  );

  const displayDate = useMemo(() => {
    const d = new Date(runDate ?? Date.now());
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [runDate]);

  // Центр карты — по bbox координат
  const mapRegion = useMemo(() => {
    if (coordinates.length === 0) return null;
    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.005),
      longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.005),
    };
  }, [coordinates]);

  // ─── Сохранение ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const run: SavedRun = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        distance,
        duration,
        avgPace,
        calories,
        splits,
        coordinates,
      };
      await saveRun(run);
      Alert.alert('Сохранено', 'Пробежка сохранена!', [
        { text: 'OK', onPress: () => navigation.navigate('Tabs') },
      ]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить пробежку.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Поделиться ──────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const text =
      `🏃 Пробежка завершена!\n` +
      `📏 Дистанция: ${formatDistance(distance)}\n` +
      `⏱ Время: ${formatDuration(duration)}\n` +
      `⚡ Темп: ${formatPace(avgPace)}\n` +
      `🔥 Калории: ${calories} ккал\n\n` +
      `Записано в RunTrack`;
    await Share.share({ message: text });
  };

  // ─── Рендер ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Кнопка назад (только в режиме просмотра) */}
        {viewOnly && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Назад</Text>
          </TouchableOpacity>
        )}

        {/* Заголовок */}
        <Text style={styles.title}>
          {viewOnly ? 'Пробежка' : 'Пробежка завершена'}
        </Text>
        <Text style={styles.subtitle}>{displayDate}</Text>

        {/* Карта маршрута */}
        <View style={styles.mapContainer}>
          {mapRegion && coordinates.length > 1 ? (
            <MapView
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              mapType="mutedStandard"
              userInterfaceStyle="dark"
            >
              <Polyline
                coordinates={coordinates.map((c) => ({
                  latitude: c.latitude,
                  longitude: c.longitude,
                }))}
                strokeColor="#00E5A0"
                strokeWidth={3}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>
                {coordinates.length < 2
                  ? 'Недостаточно GPS-точек для отображения маршрута'
                  : 'Загрузка карты…'}
              </Text>
            </View>
          )}
        </View>

        {/* Сетка 2×2 */}
        <View style={styles.grid}>
          <StatBox label="ДИСТАНЦИЯ" value={formatDistance(distance)} />
          <StatBox label="ВРЕМЯ" value={formatDuration(duration)} />
          <StatBox label="СРЕДНИЙ ТЕМП" value={formatPace(avgPace)} />
          <StatBox label="КАЛОРИИ" value={`${calories} ккал`} />
        </View>

        {/* Сплиты по км */}
        {splits.length > 0 && (
          <View style={styles.splitsBlock}>
            <Text style={styles.sectionTitle}>Сплиты</Text>
            <View style={styles.splitsHeader}>
              <Text style={styles.splitsHeaderText}>КМ</Text>
              <Text style={styles.splitsHeaderText}>ТЕМП</Text>
              <Text style={styles.splitsHeaderText}>ВРЕМЯ</Text>
            </View>
            {splits.map((split, i) => (
              <SplitRow key={split.km} split={split} isLast={i === splits.length - 1} />
            ))}
          </View>
        )}

        {/* Кнопки — только в режиме записи нового забега */}
        {!viewOnly && (
          <>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#0D0D0D" />
                ) : (
                  <Text style={styles.btnSaveText}>Сохранить</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnShare}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.btnShareText}>Поделиться</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnDiscard}
              onPress={() => navigation.navigate('Tabs')}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDiscardText}>Не сохранять</Text>
            </TouchableOpacity>
          </>
        )}

        {/* В режиме просмотра — только Поделиться */}
        {viewOnly && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnShare, styles.btnShareFull]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.btnShareText}>Поделиться</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Навигация назад
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: '#00E5A0',
    fontSize: 14,
    fontWeight: '600',
  },

  // Заголовок
  title: {
    color: '#00E5A0',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // Карта
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    height: 220,
    backgroundColor: '#1A1A1A',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mapPlaceholderText: {
    color: '#555555',
    fontSize: 13,
    textAlign: 'center',
  },

  // Сетка 2×2
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // Сплиты
  splitsBlock: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  splitsHeaderText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    flex: 1,
    textAlign: 'center',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  splitRowLast: {
    borderBottomWidth: 0,
  },
  splitKm: {
    color: '#AAAAAA',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  splitPace: {
    color: '#00E5A0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  splitTime: {
    color: '#AAAAAA',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },

  // Кнопки
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#00E5A0',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnShare: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnShareFull: {
    flex: 1,
  },
  btnShareText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDiscard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  btnDiscardText: {
    color: '#444444',
    fontSize: 13,
  },
});
