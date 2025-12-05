import { type RefObject, useEffect } from 'react';

interface UseScrollParams {
  activeIndex: number;
  isUserScrolling: RefObject<boolean>;
  flatListRef: RefObject<{
    scrollToIndex: (params: { index: number; animated: boolean; viewPosition: number }) => void;
  } | null>;
}

export const useScroll = ({activeIndex, isUserScrolling, flatListRef}: UseScrollParams): void => {
  useEffect((): void => {
    // console.log('activeIndex', activeIndex);
    if (!isUserScrolling.current && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: activeIndex < 0 ? 0 : activeIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeIndex]);
};
