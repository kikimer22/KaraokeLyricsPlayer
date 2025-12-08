import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { SongData } from '@/lib/types';
import { useAudioPlayerStore } from '@/lib/store/store';

const TICK_INTERVAL_MS = 50;
const RAF_THROTTLE_MS = 16; // ~60fps

interface UseAudioPlayerOptions {
  data: SongData;
  onTimeUpdate?: (timeMs: number) => void;
  onPlaybackEnd?: () => void;
}

export const useAudioPlayer = ({
  data,
  onTimeUpdate,
  onPlaybackEnd
}: UseAudioPlayerOptions) => {
  const {
    isPlaying,
    setIsPlaying,
    setCurrentTimeMs,
    setTotalDurationMs
  } = useAudioPlayerStore();

  const totalDurationMs = useMemo(
    () => Math.max(data.lrc.reduce((acc, l) => acc + l.duration, data.lrc[0].milliseconds), data.richSync.words[data.richSync.words.length - 1].end),
    [data.lrc, data.richSync.words]
  );
  useEffect(() => {
    setTotalDurationMs(totalDurationMs);
  }, [setTotalDurationMs, totalDurationMs]);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const lastRafTimeRef = useRef<number>(0);

  const tick = useCallback(
    (timestamp: number) => {
      // RAF throttling for better performance
      if (timestamp - lastRafTimeRef.current < RAF_THROTTLE_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastRafTimeRef.current = timestamp;

      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (elapsed >= totalDurationMs) {
        setIsPlaying(false);
        setCurrentTimeMs(totalDurationMs);
        lastPauseTimeRef.current = totalDurationMs;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        onPlaybackEnd?.();
        return;
      }

      // Update with throttling
      if (now - lastTickTimeRef.current >= TICK_INTERVAL_MS) {
        setCurrentTimeMs(elapsed);
        lastTickTimeRef.current = now;
        onTimeUpdate?.(elapsed);
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [totalDurationMs, setIsPlaying, setCurrentTimeMs, onTimeUpdate, onPlaybackEnd]
  );

  const play = useCallback(() => {
    if (isPlaying) return;

    setIsPlaying(true);
    startTimeRef.current = Date.now() - lastPauseTimeRef.current;
    lastTickTimeRef.current = Date.now();
    lastRafTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, setIsPlaying, tick]);

  const pause = useCallback(() => {
    if (!isPlaying) return;

    setIsPlaying(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    lastPauseTimeRef.current = Date.now() - startTimeRef.current;
  }, [isPlaying, setIsPlaying]);

  const toggle = useCallback(() => {
    return (isPlaying ? pause : play)();
  }, [isPlaying, play, pause]);

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
        lastRafTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [isPlaying, totalDurationMs, setIsPlaying, setCurrentTimeMs, tick]
  );

  const reset = useCallback(() => {
    pause();
    seekTo(0);
  }, [pause, seekTo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    play,
    pause,
    toggle,
    seekTo,
    reset,
  };
};
