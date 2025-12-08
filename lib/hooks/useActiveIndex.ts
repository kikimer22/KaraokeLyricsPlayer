import { useEffect, useMemo } from 'react';
import { useActiveIndexStore } from '@/lib/store/store';
import { findCurrentIndexByRichSync } from '@/lib/utils';
import type { LrcLine, WordEntry } from '@/lib/types';

interface UseActiveIndexOptions {
  lyrics: LrcLine[];
  lineWordsMap: Map<string, WordEntry[]>;
  throttleMs?: number;
}

export const useActiveIndex = ({
  lyrics,
  lineWordsMap,
  throttleMs = 50
}: UseActiveIndexOptions) => {
  const { currentTimeMs, setActiveIndex } = useActiveIndexStore();

  const throttledTime = useMemo(
    () => Math.floor(currentTimeMs / throttleMs),
    [currentTimeMs, throttleMs]
  );

  useEffect(() => {
    const index = findCurrentIndexByRichSync(lineWordsMap, lyrics, currentTimeMs);
    setActiveIndex(index);
  }, [throttledTime, lyrics, lineWordsMap, currentTimeMs, setActiveIndex]);
};
