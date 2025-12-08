import { type FC, memo, useCallback } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { WordEntry } from '@/lib/types';
import { LYRIC_LINE_HEIGHT } from '@/lib/constants';

interface WordHighlightProps {
  readonly word: WordEntry;
  readonly currentTimeMs: SharedValue<number>;
  readonly onPress: (timeMs: number) => void;
}

const WordHighlight: FC<WordHighlightProps> = ({ word, currentTimeMs, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(word.start);
  }, [word.start, onPress]);

  const gradientStyle = useAnimatedStyle(() => {
    'worklet';
    const time = currentTimeMs.value;
    const { start, end } = word;

    // Word not started
    if (time < start) {
      return { width: '0%' };
    }

    // Word completed
    if (time >= end) {
      return { width: '100%' };
    }

    // Word in progress
    const progress = interpolate(
      time,
      [start, end],
      [0, 100],
      Extrapolation.CLAMP
    );

    return { width: `${progress}%` };
  }, [word.start, word.end]);

  const displayWord = word.punctuatedWord || word.word;

  return (
    <Pressable style={styles.wordContainer} onPress={handlePress}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <Text style={styles.wordText}>{displayWord}</Text>
        }
      >
        {/* Base white text */}
        <Text style={[styles.wordText, styles.whiteText]}>{displayWord}</Text>

        {/* Gradient overlay */}
        <Animated.View style={[styles.gradientWrapper, gradientStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF6B35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>
    </Pressable>
  );
};

WordHighlight.displayName = 'WordHighlight';

const styles = StyleSheet.create({
  wordContainer: {
    marginRight: 4,
  },
  maskedView: {
    flexDirection: 'row',
  },
  wordText: {
    fontSize: 32,
    lineHeight: LYRIC_LINE_HEIGHT,
    fontWeight: '600',
  },
  whiteText: {
    color: '#FFF',
  },
  gradientWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: LYRIC_LINE_HEIGHT,
  },
});

export default memo(WordHighlight, (prev, next) => {
  return (
    prev.word.start === next.word.start &&
    prev.word.end === next.word.end &&
    prev.currentTimeMs === next.currentTimeMs
  );
});
