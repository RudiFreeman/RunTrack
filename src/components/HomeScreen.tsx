import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRunTimer } from '../hooks/useRunTimer';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { StartButton } from './StartButton';
import { StatCard } from './StatCard';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../services/locationService';

export function HomeScreen() {
  const { status, elapsed, start, pause, resume, stop, reset } = useRunTimer();
  const gps = useGPSTracker(elapsed);

  const isRunning = status === 'running';
  const isActive = status === 'running' || status === 'paused';

  // ─── Обработчики кнопок ────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
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
    stop();

    // Показываем итоги пробежки
    const distStr = formatDistance(gps.distance);
    const paceStr = formatPace(gps.averagePace);
    const timeStr = formatDuration(elapsed);

    Alert.alert(
      'Пробежка завершена!',
      `Время: ${timeStr}\nДистанция: ${distStr}\nСредний темп: ${paceStr}\nТочек GPS: ${finalCoords.length}`,
      [{ text: 'OK', onPress: () => { gps.reset(); reset(); } }],
    );
  }, [gps, stop, reset, elapsed]);

  // ─── Данные для отображения ───────────────────────────────────────────────

  // Показываем текущий темп во время бега, средний — на паузе/после
  const displayPace = isRunning && gps.currentPace > 0
    ? gps.currentPace
    : gps.averagePace;

  const statusText =
    status === 'idle'    ? 'Готов к пробежке' :
    status === 'running' ? 'Бегу...' :
    status === 'paused'  ? 'На паузе' :
                           'Пробежка завершена';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Заголовок */}
        <Text style={styles.appName}>RunTrack</Text>
        <Text style={styles.subtitle}>{statusText}</Text>

        {/* Таймер */}
        <View style={styles.timerBlock}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          <Text style={styles.timerLabel}>ВРЕМЯ</Text>
        </View>

        {/* Статистика */}
        <View style={styles.statsRow}>
          <StatCard label="ДИСТАНЦИЯ" value={formatDistance(gps.distance)} />
          <StatCard label="ТЕМП" value={formatPace(displayPace)} />
        </View>

        {/* Главная кнопка */}
        <View style={styles.buttonArea}>
          <StartButton
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
          />
        </View>

        {/* Кнопка ЗАВЕРШИТЬ (только во время активной пробежки) */}
        {isActive && (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStop}
            activeOpacity={0.7}
          >
            <Text style={styles.stopBtnText}>ЗАВЕРШИТЬ</Text>
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
