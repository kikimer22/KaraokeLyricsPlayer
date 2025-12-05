import { useState, useEffect, useRef, useCallback } from 'react';
import type { SongData } from '@/lib/types';

type UseAudioPlayerProps = SongData;

const TICK_INTERVAL_MS = 50;

export const useAudioPlayer = (data: UseAudioPlayerProps) => {
  const totalDurationMs =
    data.lrc.reduce((acc, l) => acc + l.duration, data.lrc[0].milliseconds);
  // OR
  // const totalDurationMs = data.lrc[data.lrc.length - 1].duration + data.lrc[data.lrc.length - 1].milliseconds;
  // OR
  // const totalDurationMs = data.deezer.duration * 1000;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;

    if (elapsed >= totalDurationMs) {
      setIsPlaying(false);
      setCurrentTimeMs(totalDurationMs);
      lastPauseTimeRef.current = totalDurationMs;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      setCurrentTimeMs(elapsed);
      timeoutRef.current = setTimeout(
        tick,
        Math.max(0, TICK_INTERVAL_MS - (Date.now() - now))
      );
    }
  }, [totalDurationMs]);

  const play = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    startTimeRef.current = Date.now() - lastPauseTimeRef.current;
    timeoutRef.current = setTimeout(tick, TICK_INTERVAL_MS);
  }, [isPlaying, tick]);

  const pause = useCallback(() => {
    if (!isPlaying) return;

    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastPauseTimeRef.current = Date.now() - startTimeRef.current;
  }, [isPlaying]);

  const seekTo = useCallback(
    (ms: number) => {
      const wasPlaying = isPlaying;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const clampedTime = Math.max(0, Math.min(ms, totalDurationMs));
      setCurrentTimeMs(clampedTime);
      lastPauseTimeRef.current = clampedTime;
      startTimeRef.current = Date.now() - clampedTime;

      if (wasPlaying) {
        setIsPlaying(true);
        timeoutRef.current = setTimeout(tick, TICK_INTERVAL_MS);
      }
    },
    [isPlaying, totalDurationMs, tick]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    isPlaying,
    currentTimeMs,
    totalDurationMs,
    play,
    pause,
    seekTo,
  };
};
