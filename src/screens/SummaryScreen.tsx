import React, { useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
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
import ShareCard from '../components/ShareCard';

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SplitRow({ split, isLast, timeLabel }: { split: Split; isLast: boolean; timeLabel: string }) {
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
  const { t } = useTranslation();
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
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<View>(null);

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
      Alert.alert(t('summary.saved_title'), t('summary.saved_body'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('MainTabs') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('summary.error_save'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Шеринг ──────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t('summary.share_unavailable_title'), t('summary.share_unavailable_body'));
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('summary.share_dialog_title'),
        UTI: 'public.png',
      });
    } catch {
      Alert.alert(t('common.error'), t('summary.error_share'));
    } finally {
      setSharing(false);
    }
  };

  // ─── Рендер ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* ShareCard рендерится вне экрана для captureRef */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          distanceFormatted={formatDistance(distance)}
          durationFormatted={formatDuration(duration)}
          paceFormatted={formatPace(avgPace)}
          calories={calories}
          date={displayDate}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewOnly && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t('summary.back')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>
          {viewOnly ? t('summary.title_view') : t('summary.title_new')}
        </Text>
        <Text style={styles.subtitle}>{displayDate}</Text>

        {/* Карта */}
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
                coordinates={coordinates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))}
                strokeColor="#00E5A0"
                strokeWidth={3}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>
                {coordinates.length < 2 ? t('summary.no_gps') : t('summary.map_loading')}
              </Text>
            </View>
          )}
        </View>

        {/* Сетка 2×2 */}
        <View style={styles.grid}>
          <StatBox label={t('summary.distance')} value={formatDistance(distance)} />
          <StatBox label={t('summary.time')} value={formatDuration(duration)} />
          <StatBox label={t('summary.avg_pace')} value={formatPace(avgPace)} />
          <StatBox label={t('summary.calories')} value={`${calories} ккал`} />
        </View>

        {/* Сплиты */}
        {splits.length > 0 && (
          <View style={styles.splitsBlock}>
            <Text style={styles.sectionTitle}>{t('summary.splits_title')}</Text>
            <View style={styles.splitsHeader}>
              <Text style={styles.splitsHeaderText}>{t('summary.splits_km')}</Text>
              <Text style={styles.splitsHeaderText}>{t('summary.splits_pace')}</Text>
              <Text style={styles.splitsHeaderText}>{t('summary.splits_time')}</Text>
            </View>
            {splits.map((split, i) => (
              <SplitRow
                key={split.km}
                split={split}
                isLast={i === splits.length - 1}
                timeLabel={t('summary.splits_time')}
              />
            ))}
          </View>
        )}

        {/* Кнопки — новый забег */}
        {!viewOnly && (
          <>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color="#0D0D0D" />
                  : <Text style={styles.btnSaveText}>{t('summary.btn_save')}</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnShare}
                onPress={handleShare}
                disabled={sharing}
                activeOpacity={0.8}
              >
                {sharing
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.btnShareText}>{t('summary.btn_share')}</Text>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnDiscard}
              onPress={() => navigation.navigate('MainTabs')}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDiscardText}>{t('summary.btn_discard')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Кнопки — просмотр из истории */}
        {viewOnly && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnShare, styles.btnShareFull]}
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.8}
            >
              {sharing
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.btnShareText}>{t('summary.btn_share')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  offscreen: { position: 'absolute', top: 0, left: -400, opacity: 0 },

  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#00E5A0', fontSize: 14, fontWeight: '600' },

  title: { color: '#00E5A0', fontSize: 22, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  subtitle: { color: '#666666', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 20 },

  mapContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, height: 220, backgroundColor: '#1A1A1A' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapPlaceholderText: { color: '#555555', fontSize: 13, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statBox: { width: '47%', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '600', letterSpacing: 0.5 },
  statLabel: { color: '#888888', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginTop: 4 },

  splitsBlock: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, marginBottom: 28 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  splitsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  splitsHeaderText: { color: '#555555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222222' },
  splitRowLast: { borderBottomWidth: 0 },
  splitKm: { color: '#AAAAAA', fontSize: 14, flex: 1, textAlign: 'center' },
  splitPace: { color: '#00E5A0', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'center' },
  splitTime: { color: '#AAAAAA', fontSize: 14, flex: 1, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSave: { flex: 1, backgroundColor: '#00E5A0', borderRadius: 28, paddingVertical: 16, alignItems: 'center' },
  btnSaveText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  btnShare: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: 28, paddingVertical: 16, alignItems: 'center' },
  btnShareFull: { flex: 1 },
  btnShareText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  btnDiscard: { alignItems: 'center', paddingVertical: 8 },
  btnDiscardText: { color: '#444444', fontSize: 13 },
});
