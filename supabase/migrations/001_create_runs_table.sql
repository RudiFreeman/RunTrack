-- ============================================================
-- RunTrack — Sprint 3: создание таблицы runs
-- Запусти этот SQL в Supabase: Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Таблица пробежек (соответствует SavedRun из src/types/index.ts)
CREATE TABLE IF NOT EXISTS public.runs (
  id          UUID PRIMARY KEY,                    -- тот же id, что в AsyncStorage
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        TIMESTAMPTZ NOT NULL,                -- ISO string
  distance    FLOAT NOT NULL,                      -- метры
  duration    INTEGER NOT NULL,                    -- секунды
  avg_pace    FLOAT NOT NULL,                      -- секунды/км
  calories    FLOAT NOT NULL DEFAULT 0,
  splits      JSONB NOT NULL DEFAULT '[]',         -- Split[]
  coordinates JSONB NOT NULL DEFAULT '[]',         -- Coordinate[]
  synced_at   TIMESTAMPTZ DEFAULT NOW()            -- время последней синхронизации
);

-- 2. Индекс для быстрой выборки пробежек пользователя
CREATE INDEX IF NOT EXISTS idx_runs_user_id_date ON public.runs(user_id, date DESC);

-- 3. Row Level Security — каждый видит только свои пробежки
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователь видит только свои пробежки"
  ON public.runs
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Готово! Теперь в Settings → API скопируй URL и anon key
-- и вставь в файл .env в корне проекта.
-- ============================================================
