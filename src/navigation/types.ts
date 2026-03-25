import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { SummaryParams } from '../types';

// ─── Таб-навигатор ────────────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Stats: undefined;
};

// ─── Корневой стек ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  /** Экран входа по magic link */
  Auth: undefined;
  /** Основные табы приложения */
  MainTabs: undefined;
  /** Экран итогов забега (поверх табов) */
  Summary: SummaryParams;
  /** Устаревший алиас — оставлен для обратной совместимости */
  Tabs: undefined;
};

// ─── Типы навигации для каждого экрана ──────────────────────────────────────

/** HomeScreen: таб + стек (для navigate('Summary')) */
export type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** HistoryScreen: таб + стек (для navigate('Summary')) */
export type HistoryNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'History'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type StatsNavigationProp = BottomTabNavigationProp<TabParamList, 'Stats'>;

export type SummaryRouteProp = RouteProp<RootStackParamList, 'Summary'>;
export type SummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Summary'>;
