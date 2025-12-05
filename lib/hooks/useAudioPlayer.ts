import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SongData } from '@/lib/types';

type UseAudioPlayerProps = SongData;

const TICK_INTERVAL_MS = 50;

export const useAudioPlayer = (data: UseAudioPlayerProps) => {
  const totalDurationMs = useMemo(() =>
    data.lrc.reduce((acc, l) => acc + l.duration, data.lrc[0].milliseconds),
    [data.lrc]
  );
  // OR
  // const totalDurationMs = data.lrc[data.lrc.length - 1].duration + data.lrc[data.lrc.length - 1].milliseconds;
  // OR
  // const totalDurationMs = data.deezer.duration * 1000;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;

    if (elapsed >= totalDurationMs) {
      setIsPlaying(false);
      setCurrentTimeMs(totalDurationMs);
      lastPauseTimeRef.current = totalDurationMs;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      // Update only if enough time has passed (throttling to ~50ms)
      if (now - lastTickTimeRef.current >= TICK_INTERVAL_MS) {
        setCurrentTimeMs(elapsed);
        lastTickTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [totalDurationMs]);

  const play = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    startTimeRef.current = Date.now() - lastPauseTimeRef.current;
    lastTickTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, tick]);

  const pause = useCallback(() => {
    if (!isPlaying) return;

    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastPauseTimeRef.current = Date.now() - startTimeRef.current;
  }, [isPlaying]);

  const seekTo = useCallback(
    (ms: number) => {
      const wasPlaying = isPlaying;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const clampedTime = Math.max(0, Math.min(ms, totalDurationMs));
      setCurrentTimeMs(clampedTime);
      lastPauseTimeRef.current = clampedTime;
      startTimeRef.current = Date.now() - clampedTime;

      if (wasPlaying) {
        setIsPlaying(true);
        lastTickTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [isPlaying, totalDurationMs, tick]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
