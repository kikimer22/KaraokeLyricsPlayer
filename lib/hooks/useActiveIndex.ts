import { useEffect, useMemo } from 'react';
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
  const throttledTime = useMemo(() => Math.floor(currentTimeMs / throttleMs), [currentTimeMs, throttleMs]);

  useEffect(() => {
    setActiveIndex(findCurrentIndexByRichSync(lineWordsMap, lyrics, currentTimeMs));
  }, [throttledTime, lyrics, lineWordsMap, currentTimeMs, setActiveIndex]);
};
