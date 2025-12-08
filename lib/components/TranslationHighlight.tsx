import type { WordEntry } from '@/lib/types';
import type { SharedValue } from 'react-native-reanimated';
import { FC, memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TranslationWord from '@/lib/components/TranslationWord';

interface TranslationHighlightProps {
  readonly translation: string;
  readonly originalWords: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly isActive: boolean;
  readonly hasRichSync: boolean;
}

const TranslationHighlight: FC<TranslationHighlightProps> = ({
  translation,
  originalWords,
  currentTimeMs,
  isActive,
  hasRichSync,
}) => {
  const translationWords = useMemo(() => translation.split(/\s+/), [translation]);

  return useMemo(() => {
    if (!isActive || !hasRichSync || originalWords.length === 0) {
      return <Text style={styles.translationText}>{translation}</Text>;
    }

    // Map translation words to original timing proportionally
    const wordsPerOriginal = translationWords.length / originalWords.length;

    return (
      <View style={styles.translationWrapper}>
        {translationWords.map((word, idx) => {
          // Calculate which original word this translation word corresponds to
          const originalIdx = Math.min(
            Math.floor(idx / wordsPerOriginal),
            originalWords.length - 1
          );
          const originalWord = originalWords[originalIdx];

          return (
            <TranslationWord
              key={`trans-${idx}`}
              word={word}
              start={originalWord.start}
              end={originalWord.end}
              currentTimeMs={currentTimeMs}
            />
          );
        })}
      </View>
    );
  }, [isActive, hasRichSync, originalWords, translationWords, translation, currentTimeMs]);
};

TranslationHighlight.displayName = 'TranslationHighlight';

const styles = StyleSheet.create({
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
});

export default memo(TranslationHighlight);
