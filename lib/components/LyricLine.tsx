import { type FC, memo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { Languages, LrcLine } from '@/lib/types';
import { getOpacity } from '@/lib/utils';
import { ITEM_HEIGHT, OPACITY } from '@/lib/constants';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface LyricLineProps {
  item: LrcLine;
  translationLang: Languages | null;
  index: number;
  activeIndex: number;
  progress: SharedValue<number>;
  onPress: () => void;
}

const LyricLine: FC<LyricLineProps> = ({
  item,
  translationLang,
  index,
  activeIndex,
  progress,
  onPress
}: LyricLineProps) => {
  const isActive = index === activeIndex;
  const distance = Math.abs(index - activeIndex);
  const opacity = getOpacity(distance);

  const translation = translationLang ? item.translations[translationLang] : null;

  const animatedGradientStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[styles.itemContainer, { opacity }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={OPACITY} style={styles.textWrapper}>
        {isActive ? (
          <>
            {Platform.OS === 'web' ? (
              <View style={styles.activeLineContainer}>
                <Text style={styles.lyricTextActive}>
                  {item.line}
                </Text>
              </View>
            ) : (
              <MaskedView
                style={styles.activeLineContainer}
                maskElement={
                  <Text style={styles.lyricTextActive}>
                    {item.line}
                  </Text>
                }
              >
                {/* background (unlit color) */}
                <Text style={styles.lyricTextActive}>
                  {item.line}
                </Text>

                {/* gradient-highlight on top */}
                <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </MaskedView>
            )}
          </>
        ) : (
          <Text style={styles.lyricTextStatic}>{item.line}</Text>
        )}
      </TouchableOpacity>
      {translation && (
        <Text style={styles.translationText}>{translation.text}</Text>
      )}
    </View>
  );
};

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
  },
  activeLineContainer: {
    flex: 1,
  },
  lyricTextStatic: {
    fontSize: 32,
    lineHeight: 44,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  lyricTextActive: {
    fontSize: 32,
    lineHeight: 46,
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
  },
});

export default memo(LyricLine);
