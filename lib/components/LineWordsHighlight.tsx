import { type FC, memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { WordEntry } from '@/lib/types';
import WordHighlight from '@/lib/components/WordHighlight';

interface LineWordsHighlightProps {
  readonly words: readonly WordEntry[];
  readonly currentTimeMs: SharedValue<number>;
  readonly onWordPress: (timeMs: number) => void;
}

const LineWordsHighlight: FC<LineWordsHighlightProps> = ({
  words,
  currentTimeMs,
  onWordPress
}) => {
  const lines = useMemo(() => {
    const result: WordEntry[][] = [];
    let currentLine: WordEntry[] = [];

    for (const word of words) {
      currentLine.push(word);

      if (word.isEndOfLine) {
        result.push(currentLine);
        currentLine = [];
      }
    }

    // Handle case where last word doesn't end line
    if (currentLine.length > 0) {
      result.push(currentLine);
    }

    return result;
  }, [words]);

  return (
    <View style={styles.container}>
      {lines.map((lineWords, lineIndex) => (
        <View key={`line-${lineIndex}`} style={styles.line}>
          {lineWords.map((word) => (
            <WordHighlight
              key={word._id?.$oid || `${word.start}-${word.end}`}
              word={word}
              currentTimeMs={currentTimeMs}
              onPress={onWordPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

LineWordsHighlight.displayName = 'LineWordsHighlight';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(LineWordsHighlight);
