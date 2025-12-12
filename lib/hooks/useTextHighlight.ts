import { useCallback, useMemo, useState, useRef } from 'react';
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
  const wordMappings = useMemo(() => mapWordsToChars(displayText, words), [displayText, words]);

  const layoutRef = useRef<readonly LineLayout[] | null>(null);

  const handleLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const parsed = parseTextLayoutLines(e.nativeEvent.lines);
    layoutRef.current = parsed;
    setLines(parsed);
    setReady(true);
  }, []);

  const handlePress = useCallback(
    (x: number, y: number) => {
      const fallbackStart = words[0]?.start ?? 0;

      if (!layoutRef.current || !layoutRef.current.length || !wordMappings.length) {
        currentTimeMs.value = fallbackStart;
        onWordPress(fallbackStart);
        return;
      }

      const line = getLineAtPosition(y, layoutRef.current);
      if (!line) {
        currentTimeMs.value = fallbackStart;
        onWordPress(fallbackStart);
        return;
      }

      const charPos = estimateCharPosition(x, line, isRTL);
      const targetWord = findClosestWordInLine(charPos, line, wordMappings.filter(m => m.startChar < line.endChar && m.endChar > line.startChar));
      const targetTime = targetWord?.word?.start ?? fallbackStart;

      currentTimeMs.value = targetTime;
      onWordPress(targetTime);
    },
    [currentTimeMs, onWordPress, isRTL, wordMappings, words]
  );

  return {
    lines,
    ready,
    displayText,
    wordMappings,
    resolvedDirection,
    handleLayout,
    handlePress,
  } as const;
};

export type { LineLayout, WordMapping };
