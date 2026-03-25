/**
 * syncService — синхронизация пробежек между устройством и Supabase.
 *
 * Логика offline-first:
 *  1. Пробежка всегда сохраняется локально (AsyncStorage) — это мгновенно.
 *  2. Если пользователь авторизован и есть интернет — синхронизируем в облако.
 *  3. При входе в аккаунт — автоматически загружаем/мёргим данные с сервера.
 */

import { supabase } from '../config/supabase';
import { SavedRun, Coordinate, Split } from '../types';

// Форма строки в таблице runs (snake_case — стандарт SQL)
interface RunRow {
  id: string;
  user_id: string;
  date: string;
  distance: number;
  duration: number;
  avg_pace: number;
  calories: number;
  splits: Split[];
  coordinates: Coordinate[];
  synced_at: string;
}

/** Конвертировать строку БД → SavedRun */
function rowToRun(row: RunRow): SavedRun {
  return {
    id: row.id,
    date: row.date,
    distance: row.distance,
    duration: row.duration,
    avgPace: row.avg_pace,
    calories: row.calories,
    splits: row.splits,
    coordinates: row.coordinates,
  };
}

/** Конвертировать SavedRun → строку для вставки в БД */
function runToRow(run: SavedRun, userId: string): Omit<RunRow, 'synced_at'> {
  return {
    id: run.id,
    user_id: userId,
    date: run.date,
    distance: run.distance,
    duration: run.duration,
    avg_pace: run.avgPace,
    calories: run.calories,
    splits: run.splits,
    coordinates: run.coordinates,
  };
}

export const syncService = {
  /**
   * Загрузить одну пробежку в Supabase.
   * upsert — не падает если уже есть запись с таким id.
   */
  async uploadRun(run: SavedRun, userId: string): Promise<void> {
    const { error } = await supabase
      .from('runs')
      .upsert(runToRow(run, userId));
    if (error) throw new Error(error.message);
  },

  /**
   * Скачать все пробежки пользователя из Supabase.
   * RLS в БД автоматически фильтрует по auth.uid().
   */
  async downloadRuns(): Promise<SavedRun[]> {
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as RunRow[]).map(rowToRun);
  },

  /**
   * Удалить пробежку из Supabase.
   */
  async deleteRun(runId: string): Promise<void> {
    const { error } = await supabase
      .from('runs')
      .delete()
      .eq('id', runId);
    if (error) throw new Error(error.message);
  },

  /**
   * Первичная синхронизация: загрузить все локальные пробежки в облако.
   * Вызывается один раз после входа в аккаунт.
   * Ошибки одной пробежки не останавливают остальные.
   */
  async pushLocalToCloud(localRuns: SavedRun[], userId: string): Promise<void> {
    for (const run of localRuns) {
      try {
        await this.uploadRun(run, userId);
      } catch {
        // Не критично: пробежка останется локально и синхронизируется позже
      }
    }
  },

  /**
   * Смёрджить облачные пробежки с локальными:
   * облако является источником истины, но локальные id сохраняем.
   * Возвращает итоговый список без дубликатов.
   */
  mergeRuns(localRuns: SavedRun[], cloudRuns: SavedRun[]): SavedRun[] {
    const merged = new Map<string, SavedRun>();
    // Сначала локальные
    for (const run of localRuns) merged.set(run.id, run);
    // Облачные перезаписывают (приоритет — облако)
    for (const run of cloudRuns) merged.set(run.id, run);
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
};
