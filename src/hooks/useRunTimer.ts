import { useState, useRef, useCallback } from 'react';
import { RunStatus } from '../types';

export function useRunTimer() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [elapsed, setElapsed] = useState(0); // seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(accumulatedRef.current + delta);
    }, 1000);
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current = elapsed;
    setStatus('paused');
  }, [elapsed]);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(accumulatedRef.current + delta);
    }, 1000);
    setStatus('running');
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current = 0;
    setElapsed(0);
    setStatus('finished');
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, []);

  return { status, elapsed, start, pause, resume, stop, reset };
}
