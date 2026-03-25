import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { HomeScreen } from './src/components/HomeScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import AuthScreen from './src/screens/AuthScreen';
import OTPVerifyScreen from './src/screens/OTPVerifyScreen';
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

export default function App() {
  // null = ещё проверяем, true/false = результат
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем текущую сессию при запуске
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(session !== null);
    });

    // Подписываемся на изменения состояния авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(session !== null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Показываем сплэш пока проверяем сессию
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
        // Если авторизован — сразу открываем табы, иначе — экран входа
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Auth'}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        {/* Алиас для обратной совместимости */}
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
