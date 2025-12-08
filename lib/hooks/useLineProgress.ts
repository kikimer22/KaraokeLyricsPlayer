import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { SongData } from '@/lib/types';
import { useLineProgressStore } from '@/lib/store/store';

interface UseLineProgressOptions {
  data: SongData;
}

export const useLineProgress = ({ data }: UseLineProgressOptions) => {
  const { currentTimeMs, isPlaying, activeIndex } = useLineProgressStore();
  const lineProgress = useSharedValue(0);

  const updateProgress = useCallback(
    (index: number, timeMs: number, playing: boolean) => {
      'worklet';

      cancelAnimation(lineProgress);

      if (index < 0 || index >= data.lrc.length) {
        lineProgress.value = 0;
        return;
      }

      const line = data.lrc[index];
      const lineStart = line.milliseconds;
      const lineEnd = lineStart + line.duration;

      // Out of range
      if (timeMs < lineStart || timeMs > lineEnd) {
        lineProgress.value = 0;
        return;
      }

      const offset = timeMs - lineStart;
      const progress = Math.max(0, Math.min(1, offset / line.duration));
      const remainingMs = line.duration - offset;

      lineProgress.value = progress;

      if (playing && remainingMs > 0 && progress < 1) {
        lineProgress.value = withTiming(1, {
          duration: remainingMs,
          easing: Easing.linear,
        });
      } else if (!playing || progress >= 1) {
        lineProgress.value = progress >= 1 ? 1 : progress;
      }
    },
    [data.lrc, lineProgress]
  );

  useEffect(() => {
    if (activeIndex < 0) return;
    // Only update when activeIndex changes or playback state changes
    updateProgress(activeIndex, currentTimeMs, isPlaying);
  }, [activeIndex, isPlaying, updateProgress]);

  return lineProgress;
};
