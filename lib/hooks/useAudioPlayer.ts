import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { SongData } from '@/lib/types';
import { useAudioPlayerStore } from '@/lib/store/store';
import { TICK_INTERVAL_MS, RAF_THROTTLE_MS } from '@/lib/constants';

interface UseAudioPlayerOptions {
  readonly data: SongData;
  readonly onTimeUpdate?: (timeMs: number) => void;
  readonly onPlaybackEnd?: () => void;
}

export const useAudioPlayer = ({ data, onTimeUpdate, onPlaybackEnd }: UseAudioPlayerOptions) => {
  const { isPlaying, setIsPlaying, setCurrentTimeMs, setTotalDurationMs } = useAudioPlayerStore();

  const totalDurationMs = useMemo(() => {
    const lrcEnd = data.lrc.reduce((acc, l) => acc + l.duration, data.lrc[0].milliseconds);
    const richSyncEnd = data.richSync.words[data.richSync.words.length - 1]?.end ?? 0;
    return Math.max(lrcEnd, richSyncEnd);
  }, [data.lrc, data.richSync.words]);

  useEffect(() => {
    setTotalDurationMs(totalDurationMs);
  }, [setTotalDurationMs, totalDurationMs]);

  const rafRef = useRef<number>(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastRafRef = useRef(0);

  const tick = useCallback((timestamp: number) => {
    if (timestamp - lastRafRef.current < RAF_THROTTLE_MS) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    lastRafRef.current = timestamp;

    const now = Date.now();
    const elapsed = now - startTimeRef.current;

    if (elapsed >= totalDurationMs) {
      setIsPlaying(false);
      setCurrentTimeMs(totalDurationMs);
      pauseTimeRef.current = totalDurationMs;
      cancelAnimationFrame(rafRef.current!);
      onPlaybackEnd?.();
      return;
    }

    if (now - lastTickRef.current >= TICK_INTERVAL_MS) {
      setCurrentTimeMs(elapsed);
      lastTickRef.current = now;
      onTimeUpdate?.(elapsed);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [totalDurationMs, setIsPlaying, setCurrentTimeMs, onTimeUpdate, onPlaybackEnd]);

  const play = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    startTimeRef.current = Date.now() - pauseTimeRef.current;
    lastTickRef.current = Date.now();
    lastRafRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [isPlaying, setIsPlaying, tick]);

  const pause = useCallback(() => {
    if (!isPlaying) return;
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current!);
    pauseTimeRef.current = Date.now() - startTimeRef.current;
  }, [isPlaying, setIsPlaying]);

  const toggle = useCallback(() => (isPlaying ? pause : play)(), [isPlaying, play, pause]);

  const seekTo = useCallback((ms: number) => {
    const wasPlaying = isPlaying;
    cancelAnimationFrame(rafRef.current!);

    const clamped = Math.max(0, Math.min(ms, totalDurationMs));
    setCurrentTimeMs(clamped);
    pauseTimeRef.current = clamped;
    startTimeRef.current = Date.now() - clamped;

    if (wasPlaying) {
      setIsPlaying(true);
      lastTickRef.current = Date.now();
      lastRafRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [isPlaying, totalDurationMs, setIsPlaying, setCurrentTimeMs, tick]);

  const reset = useCallback(() => {
    pause();
    seekTo(0);
  }, [pause, seekTo]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current!), []);

  return { play, pause, toggle, seekTo, reset } as const;
};
