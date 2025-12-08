import { useEffect, useRef } from 'react';
import { useActiveIndexStore } from '@/lib/store/store';
import { findCurrentIndexByRichSync } from '@/lib/utils';
import type { LrcLine, WordEntry } from '@/lib/types';

interface UseActiveIndexOptions {
  readonly lyrics: readonly LrcLine[];
  readonly lineWordsMap: Map<string, WordEntry[]>;
  readonly throttleMs?: number;
}

export const useActiveIndex = ({
  lyrics,
  lineWordsMap,
  throttleMs = 50,
}: UseActiveIndexOptions) => {
  const { currentTimeMs, setActiveIndex } = useActiveIndexStore();
  const lastIndexRef = useRef(-2);
  const lastThrottledTimeRef = useRef(-1);

  useEffect(() => {
    const throttledTime = Math.floor(currentTimeMs / throttleMs);
    if (throttledTime === lastThrottledTimeRef.current) return;
    lastThrottledTimeRef.current = throttledTime;

    const newIndex = findCurrentIndexByRichSync(lineWordsMap, lyrics, currentTimeMs);
    if (newIndex !== lastIndexRef.current) {
      lastIndexRef.current = newIndex;
      setActiveIndex(newIndex);
    }
  }, [currentTimeMs, throttleMs, lyrics, lineWordsMap, setActiveIndex]);
};
