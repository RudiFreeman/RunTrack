import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedRun } from '../types';

const STORAGE_KEY = '@runtrack_runs';

async function loadAll(): Promise<SavedRun[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as SavedRun[];
}

async function saveAll(runs: SavedRun[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

/** Сохраняет новый забег (добавляет в начало списка) */
export async function saveRun(run: SavedRun): Promise<void> {
  const runs = await loadAll();
  runs.unshift(run);
  await saveAll(runs);
}

/** Возвращает все сохранённые забеги (новые первыми) */
export async function getAllRuns(): Promise<SavedRun[]> {
  return loadAll();
}

/** Удаляет забег по id */
export async function deleteRun(id: string): Promise<void> {
  const runs = await loadAll();
  await saveAll(runs.filter((r) => r.id !== id));
}
