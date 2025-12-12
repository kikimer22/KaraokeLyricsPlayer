import { memo, useMemo, useCallback, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { WordEntry } from '@/lib/types';
import { GRADIENT_COLORS, GRADIENT_OVERDRAW_PX, LYRIC_FONT_SIZE, LYRIC_LINE_HEIGHT } from '@/lib/constants';
import { useTextHighlight, type LineLayout } from '@/lib/hooks/useTextHighlight';

const ANDROID_FULL_WIDTH_THRESHOLD = 0.98;

type MappingMeta = readonly [number, number, number, number]; // [wordStart, wordEnd, startChar, endChar]

interface HighlightLineProps {
  readonly line: LineLayout;
  readonly direction: 'rtl' | 'ltr';
  readonly currentTimeMs: SharedValue<number>;
  readonly mappingsMeta: readonly MappingMeta[];
}

const HighlightLine = memo(({ line, direction, currentTimeMs, mappingsMeta }: HighlightLineProps) => {
  const isRTL = direction === 'rtl';
  const { startChar, endChar, width } = line;
  const lineSpan = endChar - startChar;
  const extraOverdraw = Platform.OS === 'android' ? GRADIENT_OVERDRAW_PX + 2 : GRADIENT_OVERDRAW_PX;
  const fullWidth = Math.ceil(width + extraOverdraw);

  const firstMeta = mappingsMeta[0];
  const lastMeta = mappingsMeta[mappingsMeta.length - 1];
  const firstWordStart = firstMeta ? firstMeta[0] : undefined;
  const lastWordEnd = lastMeta ? lastMeta[1] : undefined;

  const progress = useDerivedValue(() => {
    'worklet';
    if (!mappingsMeta.length || lineSpan <= 0 || firstWordStart == null || lastWordEnd == null) return 0;

    const time = currentTimeMs.value;
    if (time >= lastWordEnd) return 1;
    if (time < firstWordStart) return 0;

    let charPos = startChar;

    for (let i = 0; i < mappingsMeta.length; i++) {
      const meta = mappingsMeta[i];
      const wStart = meta[2];
      const wEnd = meta[3];
      const wordStart = meta[0];
      const wordEnd = meta[1];
      const duration = wordEnd - wordStart;

      if (time < wordStart) {
        charPos = Math.max(startChar, wStart);
        break;
      }

      if (duration <= 1) {
        let groupEnd = wEnd;
        let j = i + 1;
        while (j < mappingsMeta.length) {
          const nextMeta = mappingsMeta[j];
          const nextStart = nextMeta[0];
          const nextEnd = nextMeta[1];
          if (nextEnd - nextStart <= 1 && nextStart === wordStart) {
            groupEnd = mappingsMeta[j][3];
            j++;
          } else break;
        }

        if (j < mappingsMeta.length) {
          if (time < mappingsMeta[j][0]) {
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

      if (time >= wordEnd) {
        charPos = i === mappingsMeta.length - 1 ? endChar : Math.min(endChar, mappingsMeta[i + 1][2]);
        continue;
      }

      const wordProgress = (time - wordStart) / duration;
      charPos = wStart + (wEnd - wStart) * wordProgress;
      break;
    }

    charPos = Math.max(startChar, Math.min(endChar, charPos));
    if (charPos <= startChar) return 0;
    if (charPos >= endChar) return 1;

    return (charPos - startChar) / lineSpan;
  });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const ratio = progress.value;
    const opacityTarget = ratio <= 0 ? 0 : 1;

    if (ratio <= 0) {
      return { width: withTiming(0, { duration: 120 }), opacity: withTiming(0, { duration: 160 }) };
    }

    if (ratio >= 1 || (Platform.OS === 'android' && ratio >= ANDROID_FULL_WIDTH_THRESHOLD)) {
      return { width: withTiming(fullWidth, { duration: 120 }), opacity: withTiming(1, { duration: 160 }) };
    }

    const target = Math.min(fullWidth, Math.ceil(width * ratio + extraOverdraw + 2));
    return { width: withTiming(target, { duration: 100 }), opacity: withTiming(opacityTarget, { duration: 160 }) };
  });

  if (!mappingsMeta.length) return null;

  return (
    <Animated.View style={[styles.lineOverlay, { top: line.y, height: line.height, width: fullWidth, left: line.x, pointerEvents: 'none' }]}>
      <Animated.View style={[styles.gradientContainer, isRTL && styles.gradientRTL, animatedStyle, { pointerEvents: 'none' }]}>
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
  const { lines, displayText, wordMappings, resolvedDirection, handleLayout, handlePress } =
    useTextHighlight({ text, words, currentTimeMs, onWordPress, writingDirection });

  const wrapperHeightRef = useRef<number>(0);

  const lineMappings = useMemo(() =>
    lines.map(line => {
      const relevant = wordMappings.filter(m => m.startChar < line.endChar && m.endChar > line.startChar);
      const mappingsMeta = relevant.map(m => [m.word.start, m.word.end, m.startChar, m.endChar] as const);
      return { line, mappingsMeta };
    }),
    [lines, wordMappings]
  );

  const containerWidth = useMemo(() => {
    if (!lines.length) return undefined;
    return Math.max(...lines.map(l => l.width));
  }, [lines]);

  const textStyles = useMemo(
    () => [styles.text, { lineHeight }, textStyle, resolvedDirection === 'rtl' && styles.rtlText],
    [lineHeight, textStyle, resolvedDirection]
  );

  const onPressHandler = useCallback(({ nativeEvent: { locationX, locationY } }: {
    nativeEvent: { locationX: number; locationY: number }
  }) => {
    if (!lines || !lines.length) {
      handlePress(locationX, locationY);
      return;
    }

    let targetLine = lines.find(l => locationY >= l.y && locationY < l.y + l.height) ?? null;
    if (!targetLine) targetLine = locationY < lines[0].y ? lines[0] : lines[lines.length - 1];

    const offsetX = containerWidth ? Math.max(0, (containerWidth - targetLine.width) / 2) : 0;
    const adjustedX = Math.max(0, locationX - offsetX);

    // vertical correction: text may be vertically centered inside wrapper
    const totalTextHeight = lines[lines.length - 1].y + lines[lines.length - 1].height - lines[0].y;
    const wrapperHeight = wrapperHeightRef.current || 0;
    const offsetY = wrapperHeight > totalTextHeight ? Math.max(0, (wrapperHeight - totalTextHeight) / 2) : 0;
    const adjustedY = Math.max(0, locationY - offsetY);

    handlePress(adjustedX, adjustedY);
  }, [handlePress, lines, containerWidth]);

  const wrapperDynamic = useMemo(() => ({ minHeight: lineHeight }), [lineHeight]);

  if (!words.length || !displayText.length) {
    return (
      <View style={[styles.wrapperBase, wrapperDynamic]}>
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrapperBase, wrapperDynamic]}
      onLayout={({ nativeEvent }) => { wrapperHeightRef.current = nativeEvent.layout.height; }}
    >
      <Pressable onPress={onPressHandler} style={containerWidth ? { width: containerWidth, alignSelf: 'center' } : undefined}>
        <MaskedView
          style={[styles.maskedView, containerWidth ? { width: containerWidth } : undefined]}
          maskElement={<Text style={textStyles} onTextLayout={handleLayout}>{displayText}</Text>}
        >
          <Text style={textStyles}>{displayText}</Text>
          <View style={[styles.overlayContainer, containerWidth ? { width: containerWidth, alignSelf: 'center', pointerEvents: 'none' } : undefined]}>
            {lineMappings.map(({ line, mappingsMeta }) => (
              <HighlightLine
                key={line.index}
                line={line}
                direction={resolvedDirection}
                currentTimeMs={currentTimeMs}
                mappingsMeta={mappingsMeta}
              />
            ))}
          </View>
        </MaskedView>
      </Pressable>
    </View>
  );
};

export default memo(TimedTextHighlight);

const styles = StyleSheet.create({
  wrapperBase: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  maskedView: { flexDirection: 'column' },
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
    bottom: 0
  },
  lineOverlay: { position: 'absolute', overflow: 'hidden' },
  gradientContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  gradientRTL: { left: undefined, right: 0 },
  gradient: { width: '100%', height: '100%' },
});
