import { useEffect, useRef, useCallback } from 'react';
import type { FlatList } from 'react-native';

interface UseAutoScrollOptions {
  activeIndex: number;
  enabled: boolean;
  viewPosition?: number;
  animated?: boolean;
  scrollDelayMs?: number;
}

export const useAutoScroll = ({
  activeIndex,
  enabled,
  viewPosition = 0.5,
  animated = true,
  scrollDelayMs = 150,
}: UseAutoScrollOptions) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrolledIndexRef = useRef<number>(-2);

  const scrollToPosition = useCallback(() => {
    if (!enabled || !flatListRef.current) return;
    if (activeIndex === lastScrolledIndexRef.current) return;

    try {
      if (activeIndex < 0) {
        flatListRef.current.scrollToOffset({ offset: 0, animated });
      } else {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated,
          viewPosition,
        });
      }
      lastScrolledIndexRef.current = activeIndex;
    } catch (error) {
      console.warn('Auto scroll failed:', error);
    }
  }, [activeIndex, enabled, animated, viewPosition]);

  useEffect(() => {
    if (!enabled) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(scrollToPosition, scrollDelayMs);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [enabled, scrollDelayMs, scrollToPosition]);

  return flatListRef;
};
