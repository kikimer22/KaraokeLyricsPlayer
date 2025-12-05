import { type FC, memo, useState, useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { Languages, LrcLine } from '@/lib/types';
import { getOpacity } from '@/lib/utils';
import { ITEM_HEIGHT, OPACITY, LYRIC_LINE_HEIGHT } from '@/lib/constants';

interface TextLineLayout {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

interface LyricLineProps {
  readonly item: LrcLine;
  readonly translationLang: Languages | null;
  readonly index: number;
  readonly activeIndex: number;
  readonly progress: SharedValue<number>;
  readonly onPress: () => void;
}

const LyricLine: FC<LyricLineProps> = memo(({
  item,
  translationLang,
  index,
  activeIndex,
  progress,
  onPress,
}) => {
  const isActive = index === activeIndex;
  const distance = Math.abs(index - activeIndex);
  const opacity = getOpacity(distance);

  const translation = useMemo(
    () => translationLang ? item.translations[translationLang] : null,
    [translationLang, item.translations]
  );

  const [textLines, setTextLines] = useState<readonly TextLineLayout[]>([]);

  const handleTextLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = event.nativeEvent;
      
      if (!lines?.length) {
        setTextLines([]);
        return;
      }

      const fullText = item.line;
      let textOffset = 0;
      
      const lineLayouts: TextLineLayout[] = lines.map((line, lineIndex) => {
        const lineWidth = line.width;
        const lineHeight = line.height;
        
        const lineText = (line as unknown as { text?: string }).text;
        
        let start: number;
        let end: number;
        let text: string;
        
        if (lineText) {
          start = textOffset;
          end = start + lineText.length;
          text = lineText;
          textOffset = end;
          
          while (textOffset < fullText.length &&
                 (fullText[textOffset] === ' ' || fullText[textOffset] === '\n')) {
            textOffset += 1;
          }
        } else {
          const avgCharWidth = lineWidth / Math.max(1, lineWidth / 20); // Rough estimate
          const estimatedChars = Math.floor(lineWidth / avgCharWidth);
          
          start = textOffset;
          end = Math.min(start + estimatedChars, fullText.length);
          text = fullText.substring(start, end);
          textOffset = end;
        }

        return {
          start,
          end,
          text: text.trim() || fullText.substring(start, end),
          width: lineWidth,
          height: lineHeight,
        };
      });

      setTextLines(lineLayouts);
    },
    [item.line]
  );

  const containerStyle = useMemo(
    () => [styles.itemContainer, { opacity }],
    [opacity]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={OPACITY}
          style={styles.textWrapper}
        >
          <View style={styles.activeLineContainer}>
            <Text
              style={isActive ? styles.lyricTextActive : styles.lyricTextStatic}
            >
              {item.line}
            </Text>
          </View>
        </TouchableOpacity>
        {translation && (
          <Text style={styles.translationText}>{translation.text}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={OPACITY}
        style={styles.textWrapper}
      >
        {isActive ? (
          <KaraokeTextHighlight
            text={item.line}
            textLines={textLines}
            progress={progress}
            onTextLayout={handleTextLayout}
          />
        ) : (
          <Text style={styles.lyricTextStatic}>{item.line}</Text>
        )}
      </TouchableOpacity>
      {translation && (
        <Text style={styles.translationText}>{translation.text}</Text>
      )}
    </View>
  );
});

LyricLine.displayName = 'LyricLine';

interface KaraokeTextHighlightProps {
  readonly text: string;
  readonly textLines: readonly TextLineLayout[];
  readonly progress: SharedValue<number>;
  readonly onTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
}

const KaraokeTextHighlight: FC<KaraokeTextHighlightProps> = memo(({
  text,
  textLines,
  progress,
  onTextLayout,
}) => {
  const hasLayout = textLines.length > 0;

  const maskElement = useMemo(
    () => (
      <Text style={styles.lyricTextActive} onTextLayout={onTextLayout}>
        {text}
      </Text>
    ),
    [text, onTextLayout]
  );

  const baseTextElement = useMemo(
    () => <Text style={styles.lyricTextActive}>{text}</Text>,
    [text]
  );

  if (!hasLayout) {
    return (
      <Text style={styles.lyricTextActive} onTextLayout={onTextLayout}>
        {text}
      </Text>
    );
  }

  return (
    <MaskedView style={styles.activeLineContainer} maskElement={maskElement}>
      {baseTextElement}
      <View style={StyleSheet.absoluteFill}>
        {textLines.map((line, index) => (
          <AnimatedKaraokeLine
            key={`line-${index}-${line.start}-${line.end}`}
            line={line}
            lineIndex={index}
            totalTextLength={text.length}
            progress={progress}
          />
        ))}
      </View>
    </MaskedView>
  );
});

KaraokeTextHighlight.displayName = 'KaraokeTextHighlight';

interface AnimatedKaraokeLineProps {
  readonly line: TextLineLayout;
  readonly lineIndex: number;
  readonly totalTextLength: number;
  readonly progress: SharedValue<number>;
}

const AnimatedKaraokeLine: FC<AnimatedKaraokeLineProps> = memo(({
  line,
  lineIndex,
  totalTextLength,
  progress,
}) => {
  const animatedWidthStyle = useAnimatedStyle(() => {
    'worklet';

    const currentCharPosition = progress.value * totalTextLength;
    const lineStart = line.start;
    const lineEnd = line.end;
    const lineLength = lineEnd - lineStart;

    if (currentCharPosition >= lineEnd) {
      return {
        width: '100%',
        opacity: 1,
      };
    }

    if (currentCharPosition < lineStart) {
      return {
        width: '0%',
        opacity: 0,
      };
    }

    const charsInLine = currentCharPosition - lineStart;
    const lineProgress = Math.max(0, Math.min(1, charsInLine / lineLength));
    const widthPercent = lineProgress * 100;

    return {
      width: `${widthPercent}%`,
      opacity: 1,
    };
  }, [line.start, line.end, totalTextLength]);

  const linePositionStyle = useAnimatedStyle(() => ({
    top: lineIndex * LYRIC_LINE_HEIGHT,
    height: LYRIC_LINE_HEIGHT,
  }), [lineIndex]);

  return (
    <Animated.View style={[styles.lineWrapper, linePositionStyle]}>
      <Animated.View style={[styles.gradientContainer, animatedWidthStyle]}>
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
});

AnimatedKaraokeLine.displayName = 'AnimatedKaraokeLine';

const styles = StyleSheet.create({
  itemContainer: {
    minHeight: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeLineContainer: {
    flex: 1,
    width: '100%',
  },
  lyricTextStatic: {
    fontSize: 32,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  lyricTextActive: {
    fontSize: 32,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  translationText: {
    marginTop: 8,
    fontSize: 20,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  lineWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});

export default LyricLine;
