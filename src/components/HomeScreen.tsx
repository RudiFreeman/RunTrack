import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRunTimer } from '../hooks/useRunTimer';
import { StartButton } from './StartButton';
import { StatCard } from './StatCard';
import {
  formatDuration,
  formatDistance,
  formatPace,
} from '../services/locationService';

// Simulated distance growth while running (demo mode without GPS)
function useDemoDistance(elapsed: number, isRunning: boolean) {
  // Average ~10 km/h => ~2.78 m/s
  const speed = 2.78;
  return isRunning ? Math.round(elapsed * speed) : 0;
}

export function HomeScreen() {
  const { status, elapsed, start, pause, resume, stop, reset } = useRunTimer();
  const isRunning = status === 'running';
  const isActive = status === 'running' || status === 'paused';

  const distance = useDemoDistance(elapsed, isRunning);
  const pace =
    elapsed > 0 && distance > 0 ? (elapsed / (distance / 1000)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.appName}>RunTrack</Text>
        <Text style={styles.subtitle}>
          {status === 'idle'
            ? 'Готов к пробежке'
            : status === 'running'
            ? 'Бегу...'
            : status === 'paused'
            ? 'На паузе'
            : 'Пробежка завершена'}
        </Text>

        {/* Timer */}
        <View style={styles.timerBlock}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          <Text style={styles.timerLabel}>ВРЕМЯ</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="ДИСТАНЦИЯ" value={formatDistance(distance)} />
          <StatCard label="ТЕМП" value={formatPace(pace)} />
        </View>

        {/* Main action button */}
        <View style={styles.buttonArea}>
          <StartButton
            status={status}
            onStart={start}
            onPause={pause}
            onResume={resume}
          />
        </View>

        {/* Stop button (only when active) */}
        {isActive && (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={() => { stop(); setTimeout(reset, 1500); }}
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
