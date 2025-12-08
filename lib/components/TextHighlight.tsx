import type { SharedValue } from 'react-native-reanimated';
import { type NativeSyntheticEvent, type TextLayoutEventData, View, Text, StyleSheet } from 'react-native';
import type { TextLineLayout } from '@/lib/types';
import { type FC, memo, useMemo } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LYRIC_LINE_HEIGHT } from '@/lib/constants';
import AnimatedLine from '@/lib/components/AnimatedLine';

interface TextHighlightProps {
  readonly text: string;
  readonly textLines: readonly TextLineLayout[];
  readonly progress: SharedValue<number>;
  readonly onTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
}

const TextHighlight: FC<TextHighlightProps> = ({ text, textLines, progress, onTextLayout }) => {
  const hasLayout = textLines.length > 0;

  const maskElement = useMemo(() => (
      <Text style={styles.lyricTextActive} onTextLayout={onTextLayout}>
        {text}
      </Text>
    ), [text, onTextLayout]
  );

  const baseTextElement = useMemo(() => <Text style={styles.lyricTextActive}>{text}</Text>, [text]);

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
          <AnimatedLine
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
};

TextHighlight.displayName = 'TextHighlight';

const styles = StyleSheet.create({
  activeLineContainer: {
    flex: 1,
    width: '100%',
  },
  lyricTextActive: {
    fontSize: 32,
    lineHeight: LYRIC_LINE_HEIGHT,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default memo(TextHighlight);
