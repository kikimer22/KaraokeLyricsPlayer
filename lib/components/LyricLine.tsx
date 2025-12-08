import { type FC, memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';
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
import { buildTranslationWordTimings, isRtlLanguage } from '@/lib/helpers/translation';

interface LyricLineProps {
  readonly item: LrcLine;
  readonly translationLang: Languages | null;
  readonly isActive: boolean;
  readonly onLinePress: () => void;
  readonly lineWords: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
}

const LyricLine: FC<LyricLineProps> = ({
  item,
  translationLang,
  isActive,
  onLinePress,
  lineWords,
  currentTimeMs,
  onWordPress,
}) => {
  const translation = useMemo(() => translationLang && item.translations[translationLang], [translationLang, item.translations]);
  const translationTimings = useMemo(() => buildTranslationWordTimings(translation?.text, lineWords), [translation?.text, lineWords]);
  const direction = useMemo(() => isRtlLanguage(translationLang) ? 'rtl' : 'ltr', [translationLang]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : OPACITY, { duration: OPACITY_TRANSITION_DURATION }),
  }), [isActive]);

  const renderLyric = () => {
    if (!lineWords.length || !isActive) {
      return (
        <TouchableOpacity onPress={onLinePress} activeOpacity={OPACITY} style={styles.textWrapper}>
          <Text style={styles.lyricText}>{item.line}</Text>
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

    if (!translationTimings.length || !isActive) {
      return (
        <TouchableOpacity onPress={onLinePress} activeOpacity={OPACITY} style={styles.translationWrapper}>
          <Text style={styles.translationText}>{translation.text}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TimedTextHighlight
        text={translation.text}
        words={translationTimings}
        currentTimeMs={currentTimeMs}
        onWordPress={onWordPress}
        writingDirection={direction}
        textStyle={styles.translationText}
        lineHeight={TRANSLATION_LINE_HEIGHT}
      />
    );
  };

  return (
    <Animated.View style={[styles.container, opacityStyle]}>
      <View style={styles.textWrapper}>{renderLyric()}</View>
      {renderTranslation()}
    </Animated.View>
  );
};

LyricLine.displayName = 'LyricLine';

const areEqual = (prev: LyricLineProps, next: LyricLineProps) =>
  prev.isActive === next.isActive &&
  prev.translationLang === next.translationLang &&
  prev.item._id.$oid === next.item._id.$oid &&
  prev.lineWords === next.lineWords;

export default memo(LyricLine, areEqual);

const styles = StyleSheet.create({
  container: {
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
  lyricText: {
    fontSize: LYRIC_FONT_SIZE,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  translationText: {
    fontSize: TRANSLATION_FONT_SIZE,
    lineHeight: TRANSLATION_LINE_HEIGHT,
    color: '#A0A0A0',
    fontWeight: '600',
    textAlign: 'center',
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
});
