import { memo, useMemo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { TextStyle } from 'react-native';
import type { WordEntry } from '@/lib/types';
import { GRADIENT_COLORS, GRADIENT_OVERDRAW_PX, LYRIC_FONT_SIZE, LYRIC_LINE_HEIGHT } from '@/lib/constants';
import { useTextHighlight, type LineLayout, type WordMapping } from '@/lib/hooks/useTextHighlight';

const ANDROID_FULL_WIDTH_THRESHOLD = 0.98;

interface HighlightLineProps {
  readonly line: LineLayout;
  readonly direction: 'rtl' | 'ltr';
  readonly currentTimeMs: SharedValue<number>;
  readonly lineWordMappings: readonly WordMapping[];
}

const HighlightLine = memo(({
  line,
  direction,
  currentTimeMs,
  lineWordMappings,
}: HighlightLineProps) => {
  const isRTL = direction === 'rtl';
  const { startChar, endChar, width } = line;
  const lineSpan = endChar - startChar;
  const fullWidth = width + GRADIENT_OVERDRAW_PX;

  const firstWord = lineWordMappings[0]?.word;
  const lastWord = lineWordMappings[lineWordMappings.length - 1]?.word;

  const progress = useDerivedValue(() => {
    'worklet';
    if (!lineWordMappings.length || lineSpan <= 0 || !firstWord || !lastWord) return 0;

    const time = currentTimeMs.value;
    if (time >= lastWord.end) return 1;
    if (time < firstWord.start) return 0;

    let charPos = startChar;

    for (let i = 0; i < lineWordMappings.length; i++) {
      const mapping = lineWordMappings[i];
      const { word, startChar: wStart, endChar: wEnd } = mapping;
      const duration = word.end - word.start;

      if (time < word.start) {
        charPos = Math.max(startChar, wStart);
        break;
      }

      if (duration <= 1) {
        let groupEnd = wEnd;
        let j = i + 1;
        while (j < lineWordMappings.length) {
          const next = lineWordMappings[j].word;
          if (next.end - next.start <= 1 && next.start === word.start) {
            groupEnd = lineWordMappings[j].endChar;
            j++;
          } else break;
        }

        if (j < lineWordMappings.length) {
          if (time < lineWordMappings[j].word.start) {
            charPos = Math.min(endChar, groupEnd);
            break;
          }
        } else {
          charPos = Math.min(endChar, groupEnd);
          break;
        }
        i = j - 1;
        continue;
      }

      if (time >= word.end) {
        charPos = i === lineWordMappings.length - 1 ? endChar : Math.min(endChar, lineWordMappings[i + 1].startChar);
        continue;
      }

      const wordProgress = (time - word.start) / duration;
      charPos = wStart + (wEnd - wStart) * wordProgress;
      break;
    }

    charPos = Math.max(startChar, Math.min(endChar, charPos));
    if (charPos <= startChar) return 0;
    if (charPos >= endChar) return 1;

    return (charPos - startChar) / lineSpan;
  }, [currentTimeMs]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const ratio = progress.value;
    if (ratio <= 0) return { width: 0, opacity: 0 };
    if (ratio >= 1 || (Platform.OS === 'android' && ratio >= ANDROID_FULL_WIDTH_THRESHOLD)) {
      return { width: fullWidth, opacity: 1 };
    }
    return { width: Math.min(fullWidth, width * ratio + GRADIENT_OVERDRAW_PX), opacity: 1 };
  }, [progress, fullWidth, width]);

  if (!lineWordMappings.length) return null;

  return (
    <Animated.View style={[styles.lineOverlay, {
      top: line.y,
      height: line.height,
      width: fullWidth,
      left: line.x
    }]}>
      <Animated.View style={[styles.gradientContainer, isRTL && styles.gradientRTL, animatedStyle]}>
        <LinearGradient
          colors={[...GRADIENT_COLORS]}
          start={{ x: isRTL ? 1 : 0, y: 0 }}
          end={{ x: isRTL ? 0 : 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
});

HighlightLine.displayName = 'HighlightLine';

interface TimedTextHighlightProps {
  readonly text: string;
  readonly words: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
  readonly textStyle?: TextStyle;
  readonly writingDirection?: 'rtl' | 'ltr';
  readonly lineHeight?: number;
}

const TimedTextHighlight = ({
  text,
  words,
  currentTimeMs,
  onWordPress,
  textStyle,
  writingDirection,
  lineHeight = LYRIC_LINE_HEIGHT,
}: TimedTextHighlightProps) => {
  const { lines, ready, displayText, wordMappings, resolvedDirection, handleLayout, handlePress } =
    useTextHighlight({ text, words, currentTimeMs, onWordPress, writingDirection });

  const lineMappings = useMemo(() =>
    lines.map(line => ({
      line,
      mappings: wordMappings.filter(m => m.startChar < line.endChar && m.endChar > line.startChar)
    })),
    [lines, wordMappings]
  );

  const textStyles = useMemo(
    () => [styles.text, { lineHeight }, textStyle, resolvedDirection === 'rtl' && styles.rtlText],
    [lineHeight, textStyle, resolvedDirection]
  );

  const onPressHandler = useCallback(({ nativeEvent: { locationX, locationY } }: {
    nativeEvent: { locationX: number; locationY: number }
  }) => {
    handlePress(locationX, locationY);
  }, [handlePress]);

  if (!words.length || !displayText.length) {
    return <Text style={[styles.text, textStyle]}>{text}</Text>;
  }

  if (!ready) {
    return (
      <Pressable onPress={onPressHandler}>
        <Text style={textStyles} onTextLayout={handleLayout}>{displayText}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPressHandler}>
      <MaskedView
        style={styles.maskedView}
        maskElement={<Text style={textStyles} onTextLayout={handleLayout}>{displayText}</Text>}
      >
        <Text style={textStyles}>{displayText}</Text>
        <View style={styles.overlayContainer}>
          {lineMappings.map(({ line, mappings }) => (
            <HighlightLine
              key={line.index}
              line={line}
              direction={resolvedDirection}
              currentTimeMs={currentTimeMs}
              lineWordMappings={mappings}
            />
          ))}
        </View>
      </MaskedView>
    </Pressable>
  );
};

export default memo(TimedTextHighlight);

const styles = StyleSheet.create({
  maskedView: { flexDirection: 'column', alignSelf: 'center' },
  text: {
    fontSize: LYRIC_FONT_SIZE,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center', ...(Platform.OS === 'android' && { includeFontPadding: false })
  },
  rtlText: { writingDirection: 'rtl' },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none'
  },
  lineOverlay: { position: 'absolute', overflow: 'hidden' },
  gradientContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  gradientRTL: { left: undefined, right: 0 },
  gradient: { width: '100%', height: '100%' },
});
