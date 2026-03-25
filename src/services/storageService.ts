import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedRun } from '../types';
import { supabase } from '../config/supabase';
import { syncService } from './syncService';

const STORAGE_KEY = '@runtrack_runs';

async function loadAll(): Promise<SavedRun[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedRun[];
  } catch {
    // Данные повреждены — возвращаем пустой список, не крэшим приложение
    return [];
  }
}

async function saveAll(runs: SavedRun[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

/** Получить id текущего пользователя (null если офлайн/не вошёл) */
async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Сохраняет новый забег локально и синхронизирует в облако если авторизован.
 * Offline-first: локальное сохранение всегда проходит, даже без интернета.
 */
export async function saveRun(run: SavedRun): Promise<void> {
  // 1. Сохраняем локально — это всегда быстро и офлайн
  const runs = await loadAll();
  runs.unshift(run);
  await saveAll(runs);

  // 2. Пробуем синхронизировать в облако (тихо игнорируем ошибки)
  try {
    const userId = await getUserId();
    if (userId) {
      await syncService.uploadRun(run, userId);
    }
  } catch {
    // Не критично: данные уже сохранены локально
  }
}

/** Возвращает все сохранённые забеги (новые первыми) */
export async function getAllRuns(): Promise<SavedRun[]> {
  return loadAll();
}

/**
 * Удаляет забег локально и в облаке если авторизован.
 */
export async function deleteRun(id: string): Promise<void> {
  // 1. Удаляем локально
  const runs = await loadAll();
  await saveAll(runs.filter((r) => r.id !== id));

  // 2. Пробуем удалить в облаке (тихо игнорируем ошибки)
  try {
    const userId = await getUserId();
    if (userId) {
      await syncService.deleteRun(id);
    }
  } catch {
    // Не критично
  }
}
