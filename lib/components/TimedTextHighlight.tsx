import { memo, useCallback, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View, type NativeSyntheticEvent, type TextLayoutEventData, type TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { WordEntry } from '@/lib/types';
import { GRADIENT_COLORS, GRADIENT_OVERDRAW_PX, LYRIC_FONT_SIZE, LYRIC_LINE_HEIGHT } from '@/lib/constants';

interface LineLayout {
  readonly index: number;
  readonly width: number;
  readonly startChar: number;
  readonly endChar: number;
  readonly x: number;
}

interface WordMapping {
  readonly index: number;
  readonly word: WordEntry;
  readonly startChar: number;
  readonly endChar: number;
  readonly text: string;
}

interface TimedTextHighlightProps {
  readonly text: string;
  readonly words: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
  readonly textStyle?: TextStyle;
  readonly writingDirection?: 'rtl' | 'ltr';
  readonly lineHeight?: number;
}

const mapWordsToChars = (text: string, words: readonly WordEntry[]): readonly WordMapping[] => {
  if (!text.length || words.length === 0) return [];

  let cursor = 0;
  return words.map((word, index) => {
    const token = word.punctuatedWord || word.word;
    const location = token.length ? text.indexOf(token, cursor) : -1;
    const startChar = location >= 0 ? location : cursor;
    const endChar = startChar + token.length;

    cursor = Math.max(endChar, cursor + token.length + 1);

    return {
      index,
      word,
      startChar,
      endChar,
      text: token,
    };
  });
};

const parseLines = (lines?: TextLayoutEventData['lines']): readonly LineLayout[] => {
  if (!lines?.length) return [];

  let charOffset = 0;
  return lines.map((line, index) => {
    const startChar = charOffset;
    const endChar = startChar + line.text.length;
    charOffset = endChar;

    return {
      index,
      width: line.width,
      startChar,
      endChar,
      x: line.x,
    };
  });
};

const findWordByChar = (position: number, mappings: readonly WordMapping[]) => {
  return mappings.find((mapping) => position >= mapping.startChar && position < mapping.endChar) ?? null;
};

interface HighlightLineProps {
  readonly line: LineLayout;
  readonly direction: 'rtl' | 'ltr';
  readonly currentTimeMs: SharedValue<number>;
  readonly wordMappings: readonly WordMapping[];
  readonly words: readonly WordEntry[];
  readonly textLength: number;
  readonly lineHeight: number;
}

const HighlightLine = memo(({ line, direction, currentTimeMs, wordMappings, words, textLength, lineHeight }: HighlightLineProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    const time = currentTimeMs.value;
    let charPosition = 0;

    for (let i = 0; i < wordMappings.length; i++) {
      const mapping = wordMappings[i];
      const word = mapping.word;

      if (time < word.start) {
        charPosition = mapping.startChar;
        break;
      }

      if (time >= word.end) {
        const nextMapping = wordMappings[i + 1];
        charPosition = nextMapping ? nextMapping.startChar : textLength;
        continue;
      }

      const duration = Math.max(1, word.end - word.start);
      const progress = Math.max(0, Math.min(1, (time - word.start) / duration));
      const span = mapping.endChar - mapping.startChar;
      charPosition = mapping.startChar + span * progress;
      break;
    }

    if (time >= words[words.length - 1]?.end) charPosition = textLength;

    const { startChar, endChar, width } = line;
    const lineSpan = endChar - startChar;

    if (charPosition <= startChar) return { width: 0, opacity: 0 };
    if (charPosition >= endChar) return { width, opacity: 1 };

    const filled = charPosition - startChar;
    const ratio = lineSpan > 0 ? filled / lineSpan : 0;
    const widthValue = Math.min(width, width * ratio + GRADIENT_OVERDRAW_PX);
    return { width: widthValue, opacity: 1 };
  }, [currentTimeMs, wordMappings, words, textLength, line]);

  return (
    <Animated.View
      style={[
        styles.lineOverlay,
        {
          top: line.index * lineHeight,
          height: lineHeight,
          width: line.width,
          left: line.x,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.gradientContainer,
          direction === 'rtl' && styles.gradientRTL,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[...GRADIENT_COLORS]}
          start={{ x: direction === 'rtl' ? 1 : 0, y: 0 }}
          end={{ x: direction === 'rtl' ? 0 : 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
});

HighlightLine.displayName = 'HighlightLine';

const TimedTextHighlight = ({
  text,
  words,
  currentTimeMs,
  onWordPress,
  textStyle,
  writingDirection,
  lineHeight = LYRIC_LINE_HEIGHT,
}: TimedTextHighlightProps) => {
  const [lines, setLines] = useState<readonly LineLayout[]>([]);
  const [ready, setReady] = useState(false);

  const resolvedDirection = writingDirection || (I18nManager.isRTL ? 'rtl' : 'ltr');
  const displayText = useMemo(() => text.trim(), [text]);
  const textLength = displayText.length;

  const wordMappings = useMemo(() => mapWordsToChars(displayText, words), [displayText, words]);

  const handleLayout = useCallback((event: NativeSyntheticEvent<TextLayoutEventData>) => {
    setLines(parseLines(event.nativeEvent.lines));
    setReady(true);
  }, []);

  const getLineAt = useCallback((y: number) => {
    if (!lines.length) return null;
    const index = Math.max(0, Math.min(lines.length - 1, Math.floor(y / lineHeight)));
    return lines[index];
  }, [lines, lineHeight]);

  const estimateChar = useCallback((x: number, line: LineLayout) => {
    const width = Math.max(1, line.width);
    const normalized = Math.max(0, Math.min(1, x / width));
    const directional = resolvedDirection === 'rtl' ? 1 - normalized : normalized;
    const span = line.endChar - line.startChar;
    return Math.floor(line.startChar + span * directional);
  }, [resolvedDirection]);

  const handlePress = useCallback((event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!ready || !lines.length || !wordMappings.length) {
      if (words.length) {
        currentTimeMs.value = words[0].start;
        onWordPress(words[0].start);
      }
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const line = getLineAt(locationY);

    if (!line) {
      currentTimeMs.value = words[0].start;
      onWordPress(words[0].start);
      return;
    }

    const charPosition = estimateChar(locationX, line);
    const word = findWordByChar(charPosition, wordMappings);
    const targetStart = word?.word.start ?? words[0].start;

    currentTimeMs.value = targetStart;
    onWordPress(targetStart);
  }, [ready, lines, wordMappings, words, getLineAt, estimateChar, onWordPress, currentTimeMs]);

  if (!words.length || !displayText.length) {
    return <Text style={[styles.text, textStyle]}>{text}</Text>;
  }

  const baseText = (
    <Text
      style={[
        styles.text,
        { lineHeight },
        textStyle,
        resolvedDirection === 'rtl' && styles.rtlText,
      ]}
      onTextLayout={ready ? undefined : handleLayout}
    >
      {displayText}
    </Text>
  );

  if (!ready) {
    return (
      <Pressable onPress={handlePress}>
        {baseText}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <MaskedView
        style={styles.maskedView}
        maskElement={(
          <Text
            style={[
              styles.text,
              { lineHeight },
              textStyle,
              resolvedDirection === 'rtl' && styles.rtlText,
            ]}
            onTextLayout={handleLayout}
          >
            {displayText}
          </Text>
        )}
      >
        {baseText}
        <View style={StyleSheet.absoluteFill}>
          {lines.map((line) => (
            <HighlightLine
              key={`line-${line.index}`}
              line={line}
              direction={resolvedDirection}
              currentTimeMs={currentTimeMs}
              wordMappings={wordMappings}
              words={words}
              textLength={textLength}
              lineHeight={lineHeight}
            />
          ))}
        </View>
      </MaskedView>
    </Pressable>
  );
};

export default memo(TimedTextHighlight);

const styles = StyleSheet.create({
  maskedView: {
    flexDirection: 'row',
  },
  text: {
    fontSize: LYRIC_FONT_SIZE,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lineOverlay: {
    position: 'absolute',
    overflow: 'hidden',
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientRTL: {
    left: undefined,
    right: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
