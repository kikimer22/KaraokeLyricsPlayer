import { useEffect, useRef, useCallback } from 'react';
import type { FlatList } from 'react-native';
import { AUTO_SCROLL_DELAY_MS } from '@/lib/constants';

interface UseAutoScrollOptions {
  readonly activeIndex: number;
  readonly enabled: boolean;
  readonly viewPosition?: number;
  readonly animated?: boolean;
  readonly delayMs?: number;
}

export const useAutoScroll = ({
  activeIndex,
  enabled,
  viewPosition = 0.5,
  animated = true,
  delayMs = AUTO_SCROLL_DELAY_MS,
}: UseAutoScrollOptions) => {
  const listRef = useRef<FlatList>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndexRef = useRef(-2);

  const scrollTo = useCallback(() => {
    if (!enabled || !listRef.current || activeIndex === lastIndexRef.current) return;

    try {
      if (activeIndex < 0) {
        listRef.current.scrollToOffset({ offset: 0, animated });
      } else {
        listRef.current.scrollToIndex({ index: activeIndex, animated, viewPosition });
      }
      lastIndexRef.current = activeIndex;
    } catch {
      // Scroll failed silently
    }
  }, [activeIndex, enabled, animated, viewPosition]);

  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(scrollTo, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, delayMs, scrollTo]);

  return listRef;
};
