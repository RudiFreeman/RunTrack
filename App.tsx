import 'react-native-gesture-handler';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { HomeScreen } from './src/components/HomeScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen, { ONBOARDING_KEY } from './src/screens/OnboardingScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { notificationService } from './src/services/notificationService';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { supabase } from './src/config/supabase';

// ─── Navigation ref (для тапа по уведомлению из фона) ────────────────────────

const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ─── Иконки вкладок ───────────────────────────────────────────────────────────

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

// ─── Tab-навигатор ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { t } = useTranslation();

  // Запрашиваем разрешение на уведомления один раз при первом открытии MainTabs
  useEffect(() => {
    notificationService.requestPermissionOnce().catch(() => {
      // Тихо игнорируем — уведомления не критичны для работы приложения
    });
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00E5A0',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.run'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏃" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('nav.history'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: t('nav.stats'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: t('nav.notifications'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Корневой стек ────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Парсит токены из deep link URL после magic link редиректа.
 *
 * Supabase редиректит на:
 *   runtrack://#access_token=XXX&refresh_token=YYY&type=magiclink
 *
 * Также может прийти в формате query string:
 *   runtrack://?access_token=XXX&refresh_token=YYY
 */
function extractTokens(url: string): { accessToken: string; refreshToken: string } | null {
  const separator = url.includes('#') ? '#' : (url.includes('?') ? '?' : null);
  if (!separator) return null;

  const paramString = url.slice(url.indexOf(separator) + 1);
  const params = new URLSearchParams(paramString);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

/**
 * Определяет начальный экран по результатам инициализации.
 *
 * Приоритет:
 *  1. Онбординг не завершён → показываем онбординг
 *  2. Нет сессии → экран входа
 *  3. Есть сессия → основное приложение
 */
function getInitialRoute(
  onboardingComplete: boolean,
  isAuthenticated: boolean,
): keyof RootStackParamList {
  if (!onboardingComplete) return 'Onboarding';
  if (!isAuthenticated) return 'Auth';
  return 'MainTabs';
}

export default function App() {
  // null = ещё идёт инициализация
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Проверяем флаг завершения онбординга (AsyncStorage)
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingComplete(value === 'true');
    });

    // 2. Проверяем текущую сессию Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(session !== null);
    });

    // 3. Слушаем изменения авторизации (в т.ч. после обработки magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(session !== null);
    });

    // 4. Обрабатываем deep link, если приложение было запущено через ссылку
    const handleUrl = async (url: string): Promise<void> => {
      const tokens = extractTokens(url);
      if (!tokens) return;
      await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    };

    Linking.getInitialURL().then(url => {
      if (url) void handleUrl(url);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => void handleUrl(url));

    // 5. Тап по уведомлению → открываем HomeScreen
    const notifSub = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MainTabs');
      }
    });

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
      notifSub.remove();
    };
  }, []);

  // Сплэш пока проверяем сессию и флаг онбординга
  if (isAuthenticated === null || onboardingComplete === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00E5A0" size="large" />
      </View>
    );
  }

  const initialRouteName = getInitialRoute(onboardingComplete, isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0D' },
          animation: 'slide_from_right',
        }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
