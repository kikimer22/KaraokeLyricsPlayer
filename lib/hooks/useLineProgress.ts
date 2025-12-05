import type { SongData } from '@/lib/types';
import { cancelAnimation, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useCallback, useEffect } from 'react';

interface UseLineProgressProps {
  data: SongData;
  currentTimeMs: number;
  activeIndex: number;
  isPlaying: boolean
}

export const useLineProgress = ({ data, currentTimeMs, activeIndex, isPlaying }: UseLineProgressProps) => {
  const lineProgress = useSharedValue(0);

  const updateLineProgress = useCallback((activeIndex: number, currentTimeMs: number, isPlaying: boolean) => {
    if (activeIndex < 0) {
      cancelAnimation(lineProgress);
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
    const remainingDuration = duration - offset;

    lineProgress.value = offset / duration;
    if (!isPlaying) {
      cancelAnimation(lineProgress);
      return;
    }
    lineProgress.value = withTiming(1, {
      duration: remainingDuration,
      easing: Easing.linear,
    });
  }, [data.lrc, lineProgress]);

  useEffect(() => {
    if (activeIndex < 0) return;
    updateLineProgress(activeIndex, currentTimeMs, isPlaying);
  }, [activeIndex, currentTimeMs, isPlaying, updateLineProgress]);

  return { lineProgress };
};
