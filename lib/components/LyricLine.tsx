import { type FC, memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Languages, LrcLine, WordEntry } from '@/lib/types';
import { getOpacity } from '@/lib/utils';
import { ITEM_HEIGHT, LYRIC_LINE_HEIGHT, OPACITY } from '@/lib/constants';
import LineWordsHighlight from '@/lib/components/LineWordsHighlight';
import type { SharedValue } from 'react-native-reanimated';
import TranslationHighlight from '@/lib/components/TranslationHighlight';

interface LyricLineProps {
  readonly item: LrcLine;
  readonly translationLang: Languages | null;
  readonly index: number;
  readonly activeIndex: number;
  readonly currentTimeMs: SharedValue<number>;
  readonly lineWords: readonly WordEntry[];
  readonly onWordPress: (timeMs: number) => void;
  readonly onLinePress: () => void;
}

const LyricLine: FC<LyricLineProps> = ({
  item,
  translationLang,
  index,
  activeIndex,
  currentTimeMs,
  lineWords,
  onWordPress,
  onLinePress,
}) => {
  const isActive = index === activeIndex;
  const distance = Math.abs(index - activeIndex);
  const opacity = useMemo(() => getOpacity(distance), [distance]);

  const translation = useMemo(
    () => (translationLang ? item.translations[translationLang] : null),
    [translationLang, item.translations]
  );

  const containerStyle = useMemo(
    () => [styles.itemContainer, { opacity }],
    [opacity]
  );

  const hasRichSync = lineWords.length > 0;

  // Web version - simple rendering without karaoke effect
  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <TouchableOpacity
          onPress={onLinePress}
          activeOpacity={OPACITY}
          style={styles.textWrapper}
        >
          <Text style={isActive ? styles.lyricTextActive : styles.lyricTextStatic}>
            {item.line}
          </Text>
        </TouchableOpacity>
        {translation && (
          <Text style={styles.translationText}>{translation.text}</Text>
        )}
      </View>
    );
  }

  // Native version - karaoke effect with word-level highlighting
  return (
    <View style={containerStyle}>
      <View style={styles.textWrapper}>
        {isActive && hasRichSync ? (
          <LineWordsHighlight
            words={lineWords}
            currentTimeMs={currentTimeMs}
            onWordPress={onWordPress}
          />
        ) : (
          <TouchableOpacity
            onPress={onLinePress}
            activeOpacity={OPACITY}
          >
            <Text style={styles.lyricTextStatic}>{item.line}</Text>
          </TouchableOpacity>
        )}
      </View>
      {translation && (
        <TranslationHighlight
          translation={translation.text}
          originalWords={lineWords}
          currentTimeMs={currentTimeMs}
          isActive={isActive}
          hasRichSync={hasRichSync}
        />
      )}
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
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
  translationWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  translationText: {
    marginTop: 8,
    fontSize: 20,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  translationWord: {
    fontSize: 20,
    color: '#A0A0A0',
  },
});

export default memo(LyricLine, (prevProps, nextProps) => {
  return (
    prevProps.item._id.$oid === nextProps.item._id.$oid &&
    prevProps.translationLang === nextProps.translationLang &&
    prevProps.index === nextProps.index &&
    prevProps.activeIndex === nextProps.activeIndex &&
    prevProps.currentTimeMs === nextProps.currentTimeMs &&
    prevProps.lineWords === nextProps.lineWords
  );
});
