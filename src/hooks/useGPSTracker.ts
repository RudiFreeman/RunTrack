import { useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Coordinate } from '../types';
import { calculateDistance, calculateCurrentPace, calculateAveragePace } from '../services/locationService';

export interface GPSTrackerState {
  coordinates: Coordinate[];
  distance: number;      // метры
  currentPace: number;   // секунды/км (из последних 2 точек)
  averagePace: number;   // секунды/км (за весь забег)
  hasPermission: boolean | null;
  isTracking: boolean;
}

export interface GPSTrackerActions {
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  pauseTracking: () => void;
  resumeTracking: () => Promise<void>;
  stopTracking: () => Coordinate[];
  reset: () => void;
}

export function useGPSTracker(elapsedSeconds: number): GPSTrackerState & GPSTrackerActions {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [averagePace, setAveragePace] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const coordsRef = useRef<Coordinate[]>([]);
  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Запрашиваем разрешение на геолокацию в фоне (для работы при заблокированном экране)
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') {
      setHasPermission(false);
      return false;
    }

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    const granted = background === 'granted';
    setHasPermission(granted || foreground === 'granted');
    return foreground === 'granted';
  }, []);

  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const newCoord: Coordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };

    coordsRef.current = [...coordsRef.current, newCoord];
    const updatedCoords = coordsRef.current;

    setCoordinates(updatedCoords);

    const totalDistance = calculateDistance(updatedCoords);
    setDistance(totalDistance);

    const curPace = calculateCurrentPace(updatedCoords);
    setCurrentPace(curPace);

    const avgPace = calculateAveragePace(totalDistance, elapsedRef.current);
    setAveragePace(avgPace);
  }, []);

  const startTracking = useCallback(async (): Promise<void> => {
    const granted = await requestPermission();
    if (!granted) return;

    coordsRef.current = [];
    setCoordinates([]);
    setDistance(0);
    setCurrentPace(0);
    setAveragePace(0);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,    // каждые 3 секунды
        distanceInterval: 5,   // или минимум 5 метров сдвига
      },
      handleLocationUpdate,
    );

    setIsTracking(true);
  }, [requestPermission, handleLocationUpdate]);

  const pauseTracking = useCallback((): void => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const resumeTracking = useCallback(async (): Promise<void> => {
    // Продолжаем запись, сохраняя уже накопленные точки
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      handleLocationUpdate,
    );
    setIsTracking(true);
  }, [handleLocationUpdate]);

  const stopTracking = useCallback((): Coordinate[] => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setIsTracking(false);
    return coordsRef.current;
  }, []);

  const reset = useCallback((): void => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    coordsRef.current = [];
    setCoordinates([]);
    setDistance(0);
    setCurrentPace(0);
    setAveragePace(0);
    setIsTracking(false);
  }, []);

  return {
    coordinates,
    distance,
    currentPace,
    averagePace,
    hasPermission,
    isTracking,
    requestPermission,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    reset,
  };
}
