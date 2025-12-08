import { FC, memo } from 'react';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

interface TranslationWordProps {
  readonly word: string;
  readonly start: number;
  readonly end: number;
  readonly currentTimeMs: SharedValue<number>;
}

const TranslationWord: FC<TranslationWordProps> = ({ word, start, end, currentTimeMs }) => {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const time = currentTimeMs.value;

    if (time < start) {
      return { opacity: 0.5 };
    }

    if (time >= end) {
      return { opacity: 1 };
    }

    // Fade in during word timing
    const progress = (time - start) / (end - start);
    return { opacity: 0.5 + progress * 0.5 };
  }, [start, end]);

  return (
    <Animated.Text style={[styles.translationWord, animatedStyle]}>
      {word}{' '}
    </Animated.Text>
  );
};

TranslationWord.displayName = 'TranslationWord';

const styles = StyleSheet.create({
  translationWord: {
    fontSize: 20,
    color: '#A0A0A0',
  },
});

export default memo(TranslationWord);
