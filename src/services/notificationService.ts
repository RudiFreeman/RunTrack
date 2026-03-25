/**
 * notificationService — управление push-уведомлениями в RunTrack.
 *
 * Логика:
 *  1. Разрешение запрашивается один раз при первом входе на MainTabs.
 *     Флаг '@runtrack_notif_permission_asked' в AsyncStorage.
 *  2. Настройки (включено / дни / час) хранятся в '@runtrack_notifications'.
 *  3. При сохранении настроек — все старые уведомления отменяются,
 *     новые планируются для каждого выбранного дня недели.
 *  4. Тап на уведомление → App.tsx открывает HomeScreen.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Ключи AsyncStorage ───────────────────────────────────────────────────────

export const NOTIFICATIONS_SETTINGS_KEY = '@runtrack_notifications';
const PERMISSION_ASKED_KEY = '@runtrack_notif_permission_asked';

// ─── Типы ─────────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  enabled: boolean;
  /** Индексы дней: 0=Пн, 1=Вт, 2=Ср, 3=Чт, 4=Пт, 5=Сб, 6=Вс */
  days: number[];
  /** Час уведомления (6, 7, 8, 18, 19 или 20) */
  hour: number;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  days: [0, 2, 4], // Пн, Ср, Пт
  hour: 8,
};

// ─── Тексты уведомлений (рандомно) ───────────────────────────────────────────

const MESSAGES = [
  'Время бежать! 🏃 Твои кроссовки скучают',
  'Пора на пробежку! 💪 Вперёд к новому рекорду',
  'Беги! 🌟 Вчерашний ты будет гордиться',
];

// ─── Конвертация индекса дня UI → Expo weekday ────────────────────────────────
// UI:   0=Пн  1=Вт  2=Ср  3=Чт  4=Пт  5=Сб  6=Вс
// JS:   Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6 Sun=0
// Expo: 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat

function uiDayToExpoWeekday(uiDay: number): number {
  // uiDay 0-5 (Пн-Сб) → weekday 2-7, uiDay 6 (Вс) → weekday 1
  return uiDay < 6 ? uiDay + 2 : 1;
}

// ─── Сервис ───────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  /**
   * Запрашивает разрешение на уведомления.
   * Если уже спрашивали — возвращает текущий статус без диалога.
   * Вызывается один раз при первом открытии MainTabs.
   */
  async requestPermissionOnce(): Promise<boolean> {
    const alreadyAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);

    if (alreadyAsked) {
      // Уже спрашивали — возвращаем текущий статус без диалога
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    }

    await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  /** Проверяет текущий статус разрешения без показа диалога */
  async hasPermission(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /** Загружает сохранённые настройки или возвращает дефолтные */
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return JSON.parse(raw) as NotificationSettings;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  /** Сохраняет настройки и перепланирует уведомления */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATIONS_SETTINGS_KEY, JSON.stringify(settings));
    await this.reschedule(settings);
  },

  /**
   * Отменяет все старые уведомления RunTrack и планирует новые.
   * Каждый выбранный день × 1 уведомление в нужное время.
   */
  async reschedule(settings: NotificationSettings): Promise<void> {
    // Всегда отменяем старые
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled || settings.days.length === 0) return;

    const permitted = await this.hasPermission();
    if (!permitted) return;

    for (const uiDay of settings.days) {
      const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'RunTrack',
          body: message,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: uiDayToExpoWeekday(uiDay),
          hour: settings.hour,
          minute: 0,
        },
      });
    }
  },
};
