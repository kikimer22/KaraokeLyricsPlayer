import { useCallback, useMemo, useState } from 'react';
import { I18nManager, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { WordEntry } from '@/lib/types';
import {
  type LineLayout,
  type WordMapping,
  mapWordsToChars,
  parseTextLayoutLines,
  getLineAtPosition,
  estimateCharPosition,
  findClosestWordInLine,
} from '@/lib/helpers/textLayout';

interface UseTextHighlightOptions {
  readonly text: string;
  readonly words: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
  readonly writingDirection?: 'rtl' | 'ltr';
}

export const useTextHighlight = ({
  text,
  words,
  currentTimeMs,
  onWordPress,
  writingDirection,
}: UseTextHighlightOptions) => {
  const [lines, setLines] = useState<readonly LineLayout[]>([]);
  const [ready, setReady] = useState(false);

  const resolvedDirection = writingDirection ?? (I18nManager.isRTL ? 'rtl' : 'ltr');
  const isRTL = resolvedDirection === 'rtl';
  const displayText = useMemo(() => text.trim(), [text]);
  const textLength = displayText.length;
  const wordMappings = useMemo(() => mapWordsToChars(displayText, words), [displayText, words]);

  const handleLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    setLines(parseTextLayoutLines(e.nativeEvent.lines));
    setReady(true);
  }, []);

  const handlePress = useCallback(
    (x: number, y: number) => {
      const fallbackStart = words[0]?.start ?? 0;

      if (!ready || !lines.length || !wordMappings.length) {
        currentTimeMs.value = fallbackStart;
        onWordPress(fallbackStart);
        return;
      }

      const line = getLineAtPosition(y, lines);
      if (!line) {
        currentTimeMs.value = fallbackStart;
        onWordPress(fallbackStart);
        return;
      }

      const charPos = estimateCharPosition(x, line, isRTL);
      const targetWord = findClosestWordInLine(charPos, line, wordMappings);
      const targetTime = targetWord.word.start;

      currentTimeMs.value = targetTime;
      onWordPress(targetTime);
    },
    [ready, lines, wordMappings, words, isRTL, currentTimeMs, onWordPress]
  );

  return {
    lines,
    ready,
    displayText,
    textLength,
    wordMappings,
    resolvedDirection,
    handleLayout,
    handlePress,
  } as const;
};

export type { LineLayout, WordMapping };
