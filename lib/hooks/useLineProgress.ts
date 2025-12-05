import type { SongData } from '@/lib/types';
import { cancelAnimation, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

interface UseLineProgressProps {
  data: SongData;
  currentTimeMs: number;
  activeIndex: number;
  isPlaying: boolean;
}

export const useLineProgress = ({ data, currentTimeMs, activeIndex, isPlaying }: UseLineProgressProps) => {
  const lineProgress = useSharedValue(0);

  const updateLineProgress = useCallback((activeIndex: number, currentTimeMs: number, isPlaying: boolean) => {
    cancelAnimation(lineProgress);

    if (activeIndex < 0) {
      lineProgress.value = 0;
      return;
    }

    const { milliseconds, duration } = data.lrc[activeIndex];
    const lineStart = milliseconds;
    const lineEnd = milliseconds + duration;

    if (currentTimeMs < lineStart || currentTimeMs > lineEnd) {
      lineProgress.value = 0;
      return;
    }

    const offset = currentTimeMs - lineStart;
    const currentProgress = Math.max(0, Math.min(1, offset / duration));
    const remainingDuration = duration - offset;

    lineProgress.value = currentProgress;

    if (!isPlaying) {
      return;
    }

    if (remainingDuration > 0 && currentProgress < 1) {
      lineProgress.value = withTiming(1, {
        duration: remainingDuration,
        easing: Easing.linear,
      });
    } else {
      lineProgress.value = 1;
    }
  }, [data.lrc, lineProgress]);

  useEffect(() => {
    if (activeIndex < 0) return;
    // Only update when activeIndex changes or playback state changes
    updateLineProgress(activeIndex, currentTimeMs, isPlaying);
  }, [activeIndex, isPlaying, updateLineProgress]);

  return { lineProgress };
};
