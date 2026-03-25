/**
 * ShareCard — карточка для шеринга пробежки.
 *
 * Рендерится в памяти (position absolute, opacity 0),
 * захватывается через react-native-view-shot,
 * отправляется через expo-sharing (Telegram, ВКонтакте, и т.д.)
 *
 * Размер: 360×500 — оптимальный для мобильного шеринга
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ShareCardProps {
  distanceFormatted: string; // "5.20 км"
  durationFormatted: string; // "26:41"
  paceFormatted: string;     // "5:08 / км"
  calories: number;
  date: string;              // "23 марта 2026"
}

const ShareCard = forwardRef<View, ShareCardProps>(
  ({ distanceFormatted, durationFormatted, paceFormatted, calories, date }, ref) => {
    // Извлекаем число и единицу из дистанции: "5.20 км" → ["5.20", "км"]
    const [distNum, distUnit] = distanceFormatted.split(' ');

    return (
      <View ref={ref} style={styles.card}>
        {/* Шапка */}
        <View style={styles.header}>
          <Text style={styles.runnerEmoji}>🏃</Text>
          <Text style={styles.brandName}>RunTrack</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Разделитель */}
        <View style={styles.divider} />

        {/* Главная цифра — дистанция */}
        <View style={styles.distanceBlock}>
          <Text style={styles.distanceNumber}>{distNum}</Text>
          <Text style={styles.distanceUnit}>{distUnit}</Text>
        </View>

        {/* Метрики: время + темп */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{durationFormatted}</Text>
            <Text style={styles.metricLabel}>ВРЕМЯ</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>{paceFormatted}</Text>
            <Text style={styles.metricLabel}>ТЕМП</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <Text style={styles.metricValue}>{calories}</Text>
            <Text style={styles.metricLabel}>ККАЛ</Text>
          </View>
        </View>

        {/* Нижняя полоса */}
        <View style={styles.footer}>
          <View style={styles.accentBar} />
          <Text style={styles.hashtags}>#бег #RunTrack #пробежка</Text>
        </View>
      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';
export default ShareCard;

// ─── Размеры карточки ─────────────────────────────────────────────────────────
const CARD_WIDTH = 360;
const CARD_HEIGHT = 480;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 28,
    justifyContent: 'space-between',
    // Тонкая граница для depth
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },

  // ── Шапка ──────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    gap: 4,
  },
  runnerEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00E5A0',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 13,
    color: '#666666',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── Разделитель ────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 4,
  },

  // ── Дистанция ──────────────────────────────────────────────────────────────
  distanceBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  distanceNumber: {
    fontSize: 96,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 100,
    letterSpacing: -2,
  },
  distanceUnit: {
    fontSize: 28,
    fontWeight: '600',
    color: '#00E5A0',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -8,
  },

  // ── Метрики ────────────────────────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 1.5,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2A2A2A',
  },

  // ── Подвал ─────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  accentBar: {
    width: 48,
    height: 3,
    backgroundColor: '#00E5A0',
    borderRadius: 2,
  },
  hashtags: {
    fontSize: 13,
    color: '#444444',
    letterSpacing: 0.5,
  },
});
