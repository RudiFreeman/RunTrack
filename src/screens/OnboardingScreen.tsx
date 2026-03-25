import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const ONBOARDING_KEY = '@runtrack_onboarding_complete';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Данные слайдов ───────────────────────────────────────────────────────────

interface Slide {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'track',
    icon: '📍',
    title: 'Отслеживай каждый километр',
    subtitle: 'GPS-трекинг работает в фоне и записывает каждый шаг твоего маршрута',
  },
  {
    key: 'progress',
    icon: '📈',
    title: 'Следи за прогрессом',
    subtitle: 'Графики, личные рекорды и история всех твоих пробежек в одном месте',
  },
  {
    key: 'share',
    icon: '✈️',
    title: 'Делись с друзьями',
    subtitle: 'Отправляй карточку пробежки прямо в Telegram одним нажатием',
  },
];

// ─── Типы ─────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

// ─── Компонент ────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const completeOnboarding = async (): Promise<void> => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Auth');
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const isLast = index === SLIDES.length - 1;
    return (
      <View style={styles.slide}>
        <Text style={styles.slideIcon}>{item.icon}</Text>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {isLast && (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={completeOnboarding}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>НАЧАТЬ БЕГАТЬ</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Кнопка «Пропустить» — только на первых двух слайдах */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={completeOnboarding} activeOpacity={0.7}>
          <Text style={styles.skipText}>Пропустить</Text>
        </TouchableOpacity>
      )}

      {/* Слайды */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      {/* Точки-индикаторы */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Стили ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  // Кнопка «Пропустить»
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '600',
  },

  // FlatList занимает всё доступное место между кнопкой и точками
  flatList: {
    flex: 1,
  },

  // Один слайд = ширина экрана
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  slideIcon: {
    fontSize: 80,
    marginBottom: 32,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 16,
    lineHeight: 34,
  },
  slideSubtitle: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },

  // Кнопка «НАЧАТЬ БЕГАТЬ» на последнем слайде
  startBtn: {
    backgroundColor: '#00E5A0',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Точки-индикаторы
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  dotActive: {
    backgroundColor: '#00E5A0',
    width: 24,          // активная точка шире — стандартный паттерн
    borderRadius: 4,
  },
});
