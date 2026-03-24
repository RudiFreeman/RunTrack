import { Coordinate } from '../types';

// ─── Haversine ────────────────────────────────────────────────────────────────

function haversine(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // радиус Земли в метрах
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Суммарная дистанция по массиву координат (метры) */
export function calculateDistance(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

// ─── Темп ─────────────────────────────────────────────────────────────────────

/**
 * Текущий темп из последних двух GPS-точек (секунды/км).
 * Возвращает 0, если точек недостаточно или расстояние слишком мало.
 */
export function calculateCurrentPace(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;

  const last = coords[coords.length - 1];
  const prev = coords[coords.length - 2];

  const distMeters = haversine(prev, last);
  if (distMeters < 1) return 0;

  const timeSec = (last.timestamp - prev.timestamp) / 1000;
  if (timeSec <= 0) return 0;

  const distKm = distMeters / 1000;
  return timeSec / distKm;
}

/**
 * Средний темп за весь забег (секунды/км).
 * Считается по суммарной дистанции и прошедшему времени.
 */
export function calculateAveragePace(distanceMeters: number, durationSeconds: number): number {
  if (distanceMeters < 1 || durationSeconds <= 0) return 0;
  const distKm = distanceMeters / 1000;
  return durationSeconds / distKm;
}

/**
 * Устаревшая функция — оставлена для обратной совместимости.
 * Предпочитайте calculateAveragePace.
 */
export function calculatePace(distanceMeters: number, durationSeconds: number): number {
  return calculateAveragePace(distanceMeters, durationSeconds);
}

// ─── Форматирование ──────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/** Форматирует дистанцию: "350 м" или "3.45 км" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(2)} км`;
}

/** Форматирует темп: "5:30 /км" или "--:--" если нет данных */
export function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /км`;
}
