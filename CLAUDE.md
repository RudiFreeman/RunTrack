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
├── App.tsx                        # Точка входа, рендерит <HomeScreen />
├── index.ts                       # Expo entry point
├── app.json                       # Конфиг Expo (название, иконки, splash)
├── tsconfig.json                  # TypeScript strict mode
└── src/
    ├── components/
    │   ├── HomeScreen.tsx          # Главный (и единственный) экран
    │   ├── StartButton.tsx         # Круглая кнопка 120px с spring-анимацией
    │   └── StatCard.tsx            # Карточка: значение + подпись
    ├── hooks/
    │   └── useRunTimer.ts          # Управление таймером: start/pause/resume/stop/reset
    ├── services/
    │   └── locationService.ts      # haversine, calculatePace, formatDuration/Distance/Pace
    └── types/
        └── index.ts                # RunStatus | RunSession | Coordinate | RunStats
```

### Поток данных

```
useRunTimer (elapsed, status)
    └── HomeScreen
            ├── useDemoDistance(elapsed) → distance (пока без GPS)
            ├── calculatePace(distance, elapsed) → pace
            ├── StartButton (onStart / onPause / onResume)
            └── StatCard × 2 (дистанция, темп)
```

---

## Цветовая схема

| Элемент          | Цвет      | Где используется                |
|------------------|-----------|---------------------------------|
| Фон              | `#0D0D0D` | SafeAreaView, container         |
| Акцент / СТАРТ   | `#00E5A0` | StartButton (idle/finished), заголовок |
| ПАУЗА            | `#FF6B35` | StartButton (running)           |
| СТОП / Завершить | `#FF4757` | Кнопка ЗАВЕРШИТЬ (border + text) |
| Карточки         | `#1A1A1A` | StatCard background             |
| Текст основной   | `#FFFFFF` | Таймер, значения                |
| Текст вторичный  | `#888888` | Подписи карточек, статус        |
| Таймер-метка     | `#444444` | "ВРЕМЯ" под цифрами             |

> ⚠️ Всегда проверяй контраст. Фон тёмный — текст светлый.

---

## Типы (src/types/index.ts)

```typescript
type RunStatus = 'idle' | 'running' | 'paused' | 'finished'

interface RunSession {
  id: string
  startTime: Date
  endTime?: Date
  duration: number        // секунды
  distance: number        // метры
  pace: number            // секунды на км
  coordinates: Coordinate[]
}

interface Coordinate {
  latitude: number
  longitude: number
  timestamp: number
}

interface RunStats {
  totalRuns: number
  totalDistance: number   // метры
  totalDuration: number   // секунды
  bestPace: number        // секунды на км
}
```

---

## Что уже сделано

- [x] Expo проект с TypeScript (blank-typescript)
- [x] Структура папок src/{components,hooks,services,types}
- [x] Главный экран (HomeScreen) с тёмным дизайном
- [x] Анимированная кнопка СТАРТ/ПАУЗА/ПРОДОЛЖИТЬ (spring-анимация)
- [x] Хук useRunTimer — точный таймер с паузой, сбросом
- [x] Демо-дистанция (2.78 м/с пока без GPS)
- [x] Расчёт темпа, форматирование дистанции/темпа/времени
- [x] Кнопка ЗАВЕРШИТЬ (красная, появляется во время бега)
- [x] README.md и CLAUDE.md

---

## Что следующее (по приоритету)

1. **GPS-трекинг** — подключить `expo-location`, заменить демо-дистанцию реальной
2. **Шеринг в Telegram** — через `Linking.openURL` с deep link или Telegram Bot API
3. **История пробежек** — `AsyncStorage` для офлайн, `Supabase` для синхронизации
4. **Экран результатов** — показывать итоги после ЗАВЕРШИТЬ
5. **Карта маршрута** — `react-native-maps` с записанным треком

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
"typescript": "^5.x"
```

Планируемые зависимости:
- `expo-location` — GPS
- `@supabase/supabase-js` — база данных
- `@react-native-async-storage/async-storage` — офлайн-хранилище

---

## Git

- Основная ветка разработки: `claude/runtrack-app-mvp-4Grud`
- Репозиторий: `https://github.com/RudiFreeman/RunTrack`
- Коммиты на русском или английском, в формате `feat:` / `fix:` / `docs:`
