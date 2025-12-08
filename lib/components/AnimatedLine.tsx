import type { TextLineLayout } from '@/lib/types';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { type FC, memo, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { LYRIC_LINE_HEIGHT } from '@/lib/constants';
import { StyleSheet } from 'react-native';

interface AnimatedLineProps {
  readonly line: TextLineLayout;
  readonly lineIndex: number;
  readonly totalTextLength: number;
  readonly progress: SharedValue<number>;
}

const AnimatedLine: FC<AnimatedLineProps> = ({ line, lineIndex, totalTextLength, progress }) => {
  const animatedWidthStyle = useAnimatedStyle(() => {
    'worklet';

    const currentCharPosition = progress.value * totalTextLength;
    const { start: lineStart, end: lineEnd } = line;
    const lineLength = lineEnd - lineStart;

    // Line completed
    if (currentCharPosition >= lineEnd) return { width: '100%', opacity: 1 };

    // Line not started
    if (currentCharPosition < lineStart) return { width: '0%', opacity: 0 };

    // Line in progress
    const charsInLine = currentCharPosition - lineStart;
    const lineProgress = Math.max(0, Math.min(1, charsInLine / lineLength));
    const widthPercent = lineProgress * 100;

    return {
      width: `${widthPercent}%`,
      opacity: 1,
    };
  }, [line.start, line.end, totalTextLength]);

  const linePositionStyle = useMemo(
    () => ({
      top: lineIndex * LYRIC_LINE_HEIGHT,
      height: LYRIC_LINE_HEIGHT,
    }),
    [lineIndex]
  );

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
};

AnimatedLine.displayName = 'AnimatedLine';

const styles = StyleSheet.create({
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

export default memo(AnimatedLine);
