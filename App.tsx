import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, Linking } from 'react-native';
import { HomeScreen } from './src/components/HomeScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import AuthScreen from './src/screens/AuthScreen';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { supabase } from './src/config/supabase';

// ─── Иконки вкладок ───────────────────────────────────────────────────────────

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

// ─── Tab-навигатор ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
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
          tabBarLabel: 'Бег',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏃" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'История',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Статистика',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
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
  // Ищем параметры в hash (#) или query string (?)
  const separator = url.includes('#') ? '#' : (url.includes('?') ? '?' : null);
  if (!separator) return null;

  const paramString = url.slice(url.indexOf(separator) + 1);
  const params = new URLSearchParams(paramString);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export default function App() {
  // null = ещё проверяем сессию при старте
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Проверяем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(session !== null);
    });

    // 2. Слушаем изменения авторизации (в т.ч. после обработки magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(session !== null);
    });

    // 3. Обрабатываем deep link, если приложение было запущено через ссылку
    const handleUrl = async (url: string): Promise<void> => {
      const tokens = extractTokens(url);
      if (!tokens) return;
      // Устанавливаем сессию — onAuthStateChange сработает автоматически
      await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    };

    // Приложение было закрыто, открылось по ссылке
    Linking.getInitialURL().then(url => {
      if (url) void handleUrl(url);
    });

    // Приложение было в фоне, ссылка открылась поверх
    const linkSub = Linking.addEventListener('url', ({ url }) => void handleUrl(url));

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  // Сплэш пока проверяем сессию
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00E5A0" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0D' },
          animation: 'slide_from_right',
        }}
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Auth'}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
