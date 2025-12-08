import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { TextStyle } from 'react-native';
import type { WordEntry } from '@/lib/types';
import { GRADIENT_COLORS, GRADIENT_OVERDRAW_PX, LYRIC_FONT_SIZE, LYRIC_LINE_HEIGHT } from '@/lib/constants';
import { useTextHighlight, type LineLayout, type WordMapping } from '@/lib/hooks/useTextHighlight';

interface HighlightLineProps {
  readonly line: LineLayout;
  readonly direction: 'rtl' | 'ltr';
  readonly currentTimeMs: SharedValue<number>;
  readonly wordMappings: readonly WordMapping[];
  readonly words: readonly WordEntry[];
  readonly textLength: number;
}

const HighlightLine = memo(({ line, direction, currentTimeMs, wordMappings, words, textLength }: HighlightLineProps) => {
  const isRTL = direction === 'rtl';

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';

    const time = currentTimeMs.value;
    const { startChar, endChar, width } = line;
    const lineSpan = endChar - startChar;

    let charPos = 0;
    let found = false;

    for (let i = 0; i < wordMappings.length; i++) {
      const { word, startChar: wStart, endChar: wEnd } = wordMappings[i];
      const duration = word.end - word.start;

      if (time < word.start) {
        charPos = wStart;
        found = true;
        break;
      }

      if (duration <= 1) {
        if (time >= word.start) {
          let groupEnd = wEnd;
          let j = i + 1;
          while (j < wordMappings.length) {
            const next = wordMappings[j].word;
            if (next.end - next.start <= 1 && next.start === word.start) {
              groupEnd = wordMappings[j].endChar;
              j++;
            } else break;
          }
          if (j < wordMappings.length && time < wordMappings[j].word.start) {
            charPos = groupEnd;
            found = true;
            break;
          }
        }
        continue;
      }

      if (time >= word.end) {
        charPos = wordMappings[i + 1]?.startChar ?? textLength;
        continue;
      }

      const progress = Math.min(1, (time - word.start) / duration);
      charPos = wStart + (wEnd - wStart) * progress;
      found = true;
      break;
    }

    if (!found && words.length && time >= words[words.length - 1]?.end) {
      charPos = textLength;
    }

    if (charPos <= startChar) return { width: 0, opacity: 0 };
    if (charPos >= endChar) return { width, opacity: 1 };

    const ratio = lineSpan > 0 ? (charPos - startChar) / lineSpan : 0;
    return { width: Math.min(width, width * ratio + GRADIENT_OVERDRAW_PX), opacity: 1 };
  }, [currentTimeMs, wordMappings, words, textLength, line]);

  return (
    <Animated.View style={[styles.lineOverlay, { top: line.y, height: line.height, width: line.width, left: line.x }]}>
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
  const { lines, ready, displayText, textLength, wordMappings, resolvedDirection, handleLayout, handlePress } =
    useTextHighlight({ text, words, currentTimeMs, onWordPress, writingDirection });

  if (!words.length || !displayText.length) {
    return <Text style={[styles.text, textStyle]}>{text}</Text>;
  }

  const textStyles = [styles.text, { lineHeight }, textStyle, resolvedDirection === 'rtl' && styles.rtlText];

  const onPressHandler = ({ nativeEvent: { locationX, locationY } }: { nativeEvent: { locationX: number; locationY: number } }) => {
    handlePress(locationX, locationY);
  };

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
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {lines.map((line) => (
            <HighlightLine
              key={line.index}
              line={line}
              direction={resolvedDirection}
              currentTimeMs={currentTimeMs}
              wordMappings={wordMappings}
              words={words}
              textLength={textLength}
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
  text: { fontSize: LYRIC_FONT_SIZE, color: '#FFF', fontWeight: '600', textAlign: 'center' },
  rtlText: { writingDirection: 'rtl' },
  lineOverlay: { position: 'absolute', overflow: 'hidden' },
  gradientContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  gradientRTL: { left: undefined, right: 0 },
  gradient: { width: '100%', height: '100%' },
});
