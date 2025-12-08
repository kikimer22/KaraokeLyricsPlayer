import { useEffect, useMemo } from 'react';
import { useActiveIndexStore } from '@/lib/store/store';
import { findCurrentIndex } from '@/lib/utils';
import type { LrcLine } from '@/lib/types';

interface UseActiveIndexOptions {
  lyrics: LrcLine[];
  throttleMs?: number;
}

export const useActiveIndex = ({
  lyrics,
  throttleMs = 1000
}: UseActiveIndexOptions) => {
  const { currentTimeMs, setActiveIndex } = useActiveIndexStore();

  const currentSecond = useMemo(
    () => Math.floor(currentTimeMs / throttleMs),
    [currentTimeMs, throttleMs]
  );

  useEffect(() => {
    const index = findCurrentIndex(lyrics, currentTimeMs);
    setActiveIndex(index);
  }, [currentSecond, lyrics, setActiveIndex]);
};
