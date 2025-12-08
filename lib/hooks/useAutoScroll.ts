import { useEffect, useRef, useCallback } from 'react';
import type { FlatList } from 'react-native';

interface UseAutoScrollOptions {
  activeIndex: number;
  enabled: boolean;
  viewPosition?: number;
  animated?: boolean;
}

export const useAutoScroll = ({
  activeIndex,
  enabled,
  viewPosition = 0.5,
  animated = true,
}: UseAutoScrollOptions) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToIndex = useCallback(() => {
    if (!enabled || activeIndex < 0 || !flatListRef.current) return;

    try {
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        animated,
        viewPosition,
      });
    } catch (error) {
      console.warn('Scroll to index failed:', error);
    }
  }, [activeIndex, enabled, animated, viewPosition]);

  useEffect(() => {
    // Debounce scroll to avoid too many calls
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(scrollToIndex, 50);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollToIndex]);

  return flatListRef;
};
