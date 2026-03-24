export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/** Сплит — итоги одного километра */
export interface Split {
  km: number;         // порядковый номер км (1, 2, 3…)
  duration: number;   // секунды на этот км
  pace: number;       // секунды/км
}

/** Полная запись одного забега (хранится в AsyncStorage) */
export interface SavedRun {
  id: string;
  date: string;           // ISO string
  distance: number;       // метры
  duration: number;       // секунды
  avgPace: number;        // секунды/км
  calories: number;
  splits: Split[];
  coordinates: Coordinate[];
}

export interface RunSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  distance: number;
  pace: number;
  coordinates: Coordinate[];
}

export interface RunStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  bestPace: number;
}

/** Параметры, передаваемые на экран итогов */
export interface SummaryParams {
  coordinates: Coordinate[];
  duration: number;   // секунды
  distance: number;   // метры
  avgPace: number;    // секунды/км
}
