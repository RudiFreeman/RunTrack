import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useRunTimer } from '../hooks/useRunTimer';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { StartButton } from './StartButton';
import { StatCard } from './StatCard';
import { HomeNavigationProp } from '../navigation/types';
import {
  formatDuration,
  formatDistance,
  formatPace,
  calculateDistance,
  calculateAveragePace,
} from '../services/locationService';

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNavigationProp>();
  const { status, elapsed, start, pause, resume, stop, reset } = useRunTimer();
  const gps = useGPSTracker(elapsed);

  const isRunning = status === 'running';
  const isActive = status === 'running' || status === 'paused';

  // Фиксируем момент начала пробежки, чтобы дата в истории совпадала со стартом
  const startTimeRef = useRef<number>(0);

  const handleStart = useCallback(async () => {
    // Сначала проверяем разрешение — если отказано, таймер не запускаем
    const granted = await gps.requestPermission();
    if (!granted) return;
    startTimeRef.current = Date.now();
    start();
    await gps.startTracking();
  }, [start, gps]);

  const handlePause = useCallback(() => {
    pause();
    gps.pauseTracking();
  }, [pause, gps]);

  const handleResume = useCallback(async () => {
    resume();
    await gps.resumeTracking();
  }, [resume, gps]);

  const handleStop = useCallback(() => {
    const finalCoords = gps.stopTracking();
    const finalElapsed = elapsed;
    // Пересчитываем из coordsRef — не берём из React state, который может отставать на 1 апдейт
    const finalDistance = calculateDistance(finalCoords);
    const finalAvgPace = calculateAveragePace(finalDistance, finalElapsed);

    stop();
    reset();
    gps.reset();

    navigation.navigate('Summary', {
      coordinates: finalCoords,
      duration: finalElapsed,
      distance: finalDistance,
      avgPace: finalAvgPace,
      runDate: new Date(startTimeRef.current).toISOString(),
    });
  }, [gps, stop, reset, elapsed, navigation]);

  const displayPace = isRunning && gps.currentPace > 0
    ? gps.currentPace
    : gps.averagePace;

  const statusText =
    status === 'idle'    ? t('home.status_idle') :
    status === 'running' ? t('home.status_running') :
    status === 'paused'  ? t('home.status_paused') :
                           t('home.status_finished');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.appName}>RunTrack</Text>
        <Text style={styles.subtitle}>{statusText}</Text>

        <View style={styles.timerBlock}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          <Text style={styles.timerLabel}>{t('home.timer_label')}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label={t('home.distance')} value={formatDistance(gps.distance)} />
          <StatCard label={t('home.pace')} value={formatPace(displayPace)} />
        </View>

        <View style={styles.buttonArea}>
          <StartButton
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
          />
        </View>

        {isActive && (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStop}
            activeOpacity={0.7}
          >
            <Text style={styles.stopBtnText}>{t('home.finish')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  appName: {
    color: '#00E5A0',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#666666',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  timerBlock: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: '#444444',
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 48,
  },
  buttonArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stopBtn: {
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  stopBtnText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
