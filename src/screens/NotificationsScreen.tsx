import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  notificationService,
  NotificationSettings,
  DEFAULT_SETTINGS,
} from '../services/notificationService';

// ─── Константы ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const TIME_OPTIONS = [6, 7, 8, 18, 19, 20];

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ─── Главный экран ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Загружаем настройки при каждом появлении экрана
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const [saved, permitted] = await Promise.all([
          notificationService.loadSettings(),
          notificationService.hasPermission(),
        ]);
        setSettings(saved);
        setHasPermission(permitted);
        setLoading(false);
      })();
    }, []),
  );

  const handleToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      // Запрашиваем разрешение при первом включении тоггла
      const granted = await notificationService.requestPermissionOnce();
      if (!granted) {
        Alert.alert(
          'Нет разрешения',
          'Чтобы получать напоминания, разреши уведомления в настройках телефона.',
          [{ text: 'OK' }],
        );
        return;
      }
      setHasPermission(true);
    }
    setSettings((prev) => ({ ...prev, enabled: value }));
  };

  const toggleDay = (index: number) => {
    setSettings((prev) => {
      const days = prev.days.includes(index)
        ? prev.days.filter((d) => d !== index)
        : [...prev.days, index].sort((a, b) => a - b);
      return { ...prev, days };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationService.saveSettings(settings);
      Alert.alert(
        'Сохранено',
        settings.enabled && settings.days.length > 0
          ? `Напоминания запланированы на ${settings.days.length} ${dayWord(settings.days.length)} в ${settings.hour}:00`
          : 'Напоминания отключены.',
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00E5A0" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Напоминания</Text>

        {/* ─── Главный тоггл ─────────────────────────────────────────────── */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Включить напоминания</Text>
            <Text style={styles.toggleSubtitle}>
              {hasPermission
                ? 'Уведомления в выбранные дни и время'
                : 'Разрешение не выдано'}
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#2A2A2A', true: '#00E5A0' }}
            thumbColor={settings.enabled ? '#FFFFFF' : '#555555'}
          />
        </View>

        {/* ─── Настройки (только если тоггл включён) ─────────────────────── */}
        {settings.enabled && (
          <>
            {/* Дни недели */}
            <SectionTitle title="Дни недели" />
            <View style={styles.daysGrid}>
              {DAY_LABELS.map((label, index) => {
                const active = settings.days.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayBtn, active && styles.dayBtnActive]}
                    onPress={() => toggleDay(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Время */}
            <SectionTitle title="Время" />
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((hour) => {
                const active = settings.hour === hour;
                return (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.timeBtn, active && styles.timeBtnActive]}
                    onPress={() => setSettings((prev) => ({ ...prev, hour }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.timeBtnText, active && styles.timeBtnTextActive]}>
                      {`${String(hour).padStart(2, '0')}:00`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Кнопка сохранения ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#0D0D0D" />
            : <Text style={styles.saveBtnText}>Сохранить</Text>
          }
        </TouchableOpacity>

        {/* Подсказка если ничего не выбрано */}
        {settings.enabled && settings.days.length === 0 && (
          <Text style={styles.hint}>Выбери хотя бы один день</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Вспомогательная функция склонения слова «день» ──────────────────────────

function dayWord(n: number): string {
  if (n === 1) return 'день';
  if (n >= 2 && n <= 4) return 'дня';
  return 'дней';
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  headerTitle: {
    color: '#00E5A0',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
  },

  // Тоггл
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  toggleSubtitle: { color: '#666666', fontSize: 12, marginTop: 3 },

  // Заголовки секций
  sectionTitle: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },

  // Дни недели
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  dayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    minWidth: 40,
    alignItems: 'center',
  },
  dayBtnActive: {
    backgroundColor: '#00E5A0',
  },
  dayBtnText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '700',
  },
  dayBtnTextActive: {
    color: '#0D0D0D',
  },

  // Время
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  timeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  timeBtnActive: {
    backgroundColor: '#00E5A0',
  },
  timeBtnText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeBtnTextActive: {
    color: '#0D0D0D',
  },

  // Кнопка сохранить
  saveBtn: {
    backgroundColor: '#00E5A0',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  hint: {
    color: '#555555',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
