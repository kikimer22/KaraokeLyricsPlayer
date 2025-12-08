import { type FC, memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { Languages, LrcLine, WordEntry } from '@/lib/types';
import {
  ITEM_HEIGHT,
  LYRIC_LINE_HEIGHT,
  LYRIC_FONT_SIZE,
  OPACITY,
  OPACITY_TRANSITION_DURATION,
  TRANSLATION_LINE_HEIGHT,
  TRANSLATION_FONT_SIZE,
} from '@/lib/constants';
import TimedTextHighlight from '@/lib/components/TimedTextHighlight';
import type { SharedValue } from 'react-native-reanimated';

interface LyricLineProps {
  readonly item: LrcLine;
  readonly translationLang: Languages | null;
  readonly index: number;
  readonly activeIndex: number;
  readonly onLinePress: () => void;
  readonly lineWords: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
}

const buildTranslationWordTimings = (translationText: string | undefined, sourceWords: readonly WordEntry[]): WordEntry[] => {
  if (!translationText?.trim() || sourceWords.length === 0) return [];

  const tokens = translationText.trim().split(/\s+/);
  if (!tokens.length) return [];

  const ratio = sourceWords.length / tokens.length;

  return tokens.map((token, idx) => {
    const mappedIndex = Math.min(sourceWords.length - 1, Math.floor(idx * ratio));
    const reference = sourceWords[mappedIndex];
    return {
      ...reference,
      word: token,
      punctuatedWord: token,
      isEstimatedTiming: true,
      isEndOfLine: idx === tokens.length - 1,
    } as WordEntry;
  });
};

const isRtlLanguage = (lang: Languages | null) => lang === 'he';

const LyricLine: FC<LyricLineProps> = ({
  item,
  translationLang,
  index,
  activeIndex,
  onLinePress,
  lineWords,
  currentTimeMs,
  onWordPress,
}) => {
  const isActive = index === activeIndex;

  const translation = useMemo(
    () => (translationLang ? item.translations[translationLang] : null),
    [translationLang, item.translations]
  );

  const translationWordTimings = useMemo(
    () => buildTranslationWordTimings(translation?.text, lineWords),
    [translation?.text, lineWords]
  );

  const writingDirection = isRtlLanguage(translationLang) ? 'rtl' : 'ltr';

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : OPACITY, { duration: OPACITY_TRANSITION_DURATION })
  }), [isActive]);

  const renderLineText = () => {
    if (lineWords.length === 0 || !isActive) {
      return (
        <TouchableOpacity
          onPress={onLinePress}
          activeOpacity={OPACITY}
          style={styles.textWrapper}
        >
          <Text style={isActive ? styles.lyricTextActive : styles.lyricTextStatic}>
            {item.line}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TimedTextHighlight
        text={item.line}
        words={lineWords}
        currentTimeMs={currentTimeMs}
        onWordPress={onWordPress}
        writingDirection="ltr"
      />
    );
  };

  const renderTranslation = () => {
    if (!translation) return null;

    if (!translationWordTimings.length || !isActive) {
      return (
        <TouchableOpacity
          onPress={onLinePress}
          activeOpacity={OPACITY}
          style={styles.translationWrapper}
        >
          <Text style={styles.translationText}>{translation.text}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TimedTextHighlight
        text={translation.text}
        words={translationWordTimings}
        currentTimeMs={currentTimeMs}
        onWordPress={onWordPress}
        writingDirection={writingDirection}
        textStyle={styles.translationText}
        lineHeight={TRANSLATION_LINE_HEIGHT}
      />
    );
  };

  return (
    <Animated.View style={[styles.itemContainer, animatedOpacity]}>
      <View style={styles.textWrapper}>{renderLineText()}</View>
      {renderTranslation()}
    </Animated.View>
  );
};

LyricLine.displayName = 'LyricLine';

const styles = StyleSheet.create({
  itemContainer: {
    minHeight: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textWrapper: {
    minHeight: LYRIC_LINE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  translationWrapper: {
    minHeight: TRANSLATION_LINE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  lyricTextStatic: {
    fontSize: LYRIC_FONT_SIZE,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  lyricTextActive: {
    fontSize: LYRIC_FONT_SIZE,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  translationText: {
    fontSize: TRANSLATION_FONT_SIZE,
    lineHeight: TRANSLATION_LINE_HEIGHT,
    color: '#A0A0A0',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default memo(LyricLine);
