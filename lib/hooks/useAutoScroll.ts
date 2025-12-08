import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!enabled || activeIndex === lastIndexRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!listRef.current) return;

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
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeIndex, enabled, animated, viewPosition, delayMs]);

  return listRef;
};
