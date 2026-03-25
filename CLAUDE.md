# RunTrack — Память проекта для Claude

Этот файл — твоя рабочая память о проекте. Читай его перед каждым изменением.

---

## Что это за проект

MVP бегового трекера для рынка СНГ. Построен на Expo + TypeScript.
Целевая аудитория: бегуны в России и СНГ, которым нужен простой трекер без лишнего.

---

## Архитектура

```
RunTrack/
├── App.tsx                          # Точка входа, Tab + Stack навигация
├── index.ts                         # Expo entry point
├── app.json                         # Конфиг Expo (название, иконки, splash)
├── tsconfig.json                    # TypeScript strict mode
└── src/
    ├── components/
    │   ├── HomeScreen.tsx            # Экран бега: таймер, GPS, кнопки
    │   ├── StartButton.tsx           # Круглая кнопка 120px с spring-анимацией
    │   └── StatCard.tsx              # Карточка: значение + подпись
    ├── hooks/
    │   ├── useRunTimer.ts            # Управление таймером: start/pause/resume/stop/reset
    │   └── useGPSTracker.ts          # GPS-трекинг через expo-location
    ├── navigation/
    │   └── types.ts                  # TabParamList, RootStackParamList, типы навигации
    ├── screens/
    │   ├── SummaryScreen.tsx         # Итоги забега (карта, сплиты, калории, шеринг)
    │   ├── HistoryScreen.tsx         # История (список, суммарная статистика, свайп-удаление)
    │   └── StatsScreen.tsx           # Статистика (графики, рекорды, периоды)
    ├── services/
    │   ├── locationService.ts        # haversine, calculatePace, форматирование
    │   └── storageService.ts         # CRUD: saveRun / getAllRuns / deleteRun
    └── types/
        └── index.ts                  # RunStatus | SavedRun | RunSession | Coordinate | Split | SummaryParams
```

### Поток данных

```
NavigationContainer
  └── RootStack
        ├── Tabs (TabNavigator)
        │     ├── 🏃 Home (HomeScreen)
        │     │       └── useRunTimer + useGPSTracker → navigate('Summary', params)
        │     ├── 📊 History (HistoryScreen)
        │     │       └── getAllRuns → tap → navigate('Summary', { viewOnly: true, ...run })
        │     └── 📈 Stats (StatsScreen)
        │             └── getAllRuns → VictoryBar / VictoryLine / рекорды
        └── Summary (SummaryScreen) — поверх табов, без таб-бара
```

---

## Цветовая схема

| Элемент          | Цвет      | Где используется                |
|------------------|-----------|---------------------------------|
| Фон              | `#0D0D0D` | SafeAreaView, container         |
| Акцент / СТАРТ   | `#00E5A0` | StartButton (idle/finished), заголовки, графики |
| ПАУЗА            | `#FF6B35` | StartButton (running)           |
| СТОП / Завершить | `#FF4757` | Кнопка ЗАВЕРШИТЬ, удаление      |
| Карточки         | `#1A1A1A` | StatCard, RecordCard, TabBar    |
| Фон графиков     | `#111111` | chartCard                       |
| Текст основной   | `#FFFFFF` | Таймер, значения                |
| Текст вторичный  | `#888888` | Подписи карточек, статус        |
| Текст третичный  | `#555555` | Метки осей, пустые состояния    |
| Таймер-метка     | `#444444` | "ВРЕМЯ" под цифрами             |

> ⚠️ Всегда проверяй контраст. Фон тёмный — текст светлый.

---

## Типы (src/types/index.ts)

```typescript
type RunStatus = 'idle' | 'running' | 'paused' | 'finished'

interface SavedRun {
  id: string
  date: string           // ISO string
  distance: number       // метры
  duration: number       // секунды
  avgPace: number        // секунды/км
  calories: number
  splits: Split[]
  coordinates: Coordinate[]
}

interface Split {
  km: number             // порядковый номер км
  duration: number       // секунды на этот км
  pace: number           // секунды/км
}

interface SummaryParams {
  coordinates: Coordinate[]
  duration: number
  distance: number
  avgPace: number
  viewOnly?: boolean     // true → скрыть кнопку «Сохранить»
  runDate?: string       // ISO — дата для отображения
  splits?: Split[]       // готовые сплиты (из истории)
  calories?: number      // готовые калории (из истории)
}
```

---

## Что уже сделано

### Sprint 1 — Базовый MVP
- [x] Expo проект с TypeScript (blank-typescript)
- [x] Структура папок src/{components,hooks,services,types,screens,navigation}
- [x] Главный экран (HomeScreen) с тёмным дизайном
- [x] Анимированная кнопка СТАРТ/ПАУЗА/ПРОДОЛЖИТЬ (spring-анимация)
- [x] Хук useRunTimer — точный таймер с паузой, сбросом
- [x] Расчёт темпа, форматирование дистанции/темпа/времени
- [x] Кнопка ЗАВЕРШИТЬ (красная, появляется во время бега)

### Sprint 2 — Данные и история
- [x] GPS-трекинг через expo-location (useGPSTracker)
- [x] SummaryScreen — карта маршрута (react-native-maps), сплиты по км, калории, шеринг
- [x] AsyncStorage — сохранение/загрузка/удаление пробежек (storageService)
- [x] HistoryScreen — список забегов, суммарная статистика, свайп для удаления, просмотр итогов
- [x] SummaryScreen viewOnly — режим просмотра из истории (без кнопки «Сохранить»)
- [x] Tab-навигация: 🏃 Бег / 📊 История / 📈 Статистика
- [x] StatsScreen — барчарт дистанции по дням, линейный график темпа, личные рекорды
- [x] victory-native v36 для графиков (SVG-based, без Skia)

---

## Sprint 3 — В работе

### Supabase Auth + Sync (в работе)
- [x] `@supabase/supabase-js` установлен
- [x] `src/config/supabase.ts` — клиент с AsyncStorage адаптером
- [x] `src/services/authService.ts` — вход по телефону (OTP), выход, getUser
- [x] `src/services/syncService.ts` — upload/download/delete/merge пробежек
- [x] `src/screens/AuthScreen.tsx` — экран ввода номера телефона
- [x] `src/screens/OTPVerifyScreen.tsx` — экран ввода 6-значного кода
- [x] `supabase/migrations/001_create_runs_table.sql` — SQL миграция (запустить в Supabase Dashboard)
- [x] `storageService.ts` — обновлён: saveRun/deleteRun синхронизируют с облаком если авторизован
- [x] `App.tsx` — проверка сессии при старте, маршрутизация Auth/MainTabs
- [x] `.env.example` — шаблон переменных окружения

### Ещё в Sprint 3
- [ ] **Шеринг в Telegram** — карточка забега (изображение с метриками)
- [ ] **Push-уведомления** — напоминания о тренировках (`expo-notifications`)
- [ ] **Цели и план тренировок** — недельный план, прогресс к цели

### Как активировать Supabase
1. Создать проект на supabase.com (регион Frankfurt)
2. Запустить `supabase/migrations/001_create_runs_table.sql` в SQL Editor
3. Authentication → Providers → Phone → включить + настроить Twilio (или использовать Email)
4. Скопировать URL и anon key из Settings → API
5. Создать файл `.env` в корне:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   ```

---

## Правила проекта

1. **Интерфейс только на русском** — все тексты, кнопки, подписи на русском языке
2. **Offline-first** — приложение работает без интернета, данные синхронизируются потом
3. **TypeScript strict** — никаких `any`, все типы явные
4. **Минимализм** — не добавлять фичи сверх текущего спринта
5. **Тёмная тема** — всегда, без светлой версии в MVP

---

## Зависимости

```json
"expo": "~51.x",
"react-native": "0.74.x",
"typescript": "^5.x",
"expo-location": "^17.x",
"react-native-maps": "^1.x",
"@react-native-async-storage/async-storage": "^1.x",
"victory-native": "^36.x",
"react-native-svg": "^15.x",
"@react-navigation/native": "^6.x",
"@react-navigation/native-stack": "^6.x",
"@react-navigation/bottom-tabs": "^6.x"
```

Добавлено в Sprint 3:
- `@supabase/supabase-js` ^2.x — облачная БД и авторизация (установлено)

Планируется:
- `expo-notifications` — push-уведомления

---

## Git

- Основная ветка разработки: `claude/runtrack-app-mvp-4Grud`
- Репозиторий: `https://github.com/RudiFreeman/RunTrack`
- Коммиты на русском или английском, в формате `feat:` / `fix:` / `docs:`
