export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface RunSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  distance: number; // meters
  pace: number; // seconds per km
  coordinates: Coordinate[];
}

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface RunStats {
  totalRuns: number;
  totalDistance: number; // meters
  totalDuration: number; // seconds
  bestPace: number; // seconds per km
}
