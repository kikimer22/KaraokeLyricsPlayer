import { type FC, memo, useState, useCallback, useMemo } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { Languages, LrcLine, TextLineLayout } from '@/lib/types';
import { getOpacity } from '@/lib/utils';
import { ITEM_HEIGHT, LYRIC_LINE_HEIGHT, OPACITY } from '@/lib/constants';
import TextHighlight from '@/lib/components/TextHighlight';

interface LyricLineProps {
  readonly item: LrcLine;
  readonly translationLang: Languages | null;
  readonly index: number;
  readonly activeIndex: number;
  readonly progress: SharedValue<number>;
  readonly onPress: () => void;
}

const LyricLine: FC<LyricLineProps> = ({ item, translationLang, index, activeIndex, progress, onPress }) => {
  const isActive = index === activeIndex;
  const distance = Math.abs(index - activeIndex);

  const opacity = useMemo(() => getOpacity(distance), [distance]);

  const translation = useMemo(
    () => (translationLang ? item.translations[translationLang] : null),
    [translationLang, item.translations]
  );

  const [textLines, setTextLines] = useState<readonly TextLineLayout[]>([]);

  const handleTextLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = event.nativeEvent;

      if (!lines?.length) {
        setTextLines([]);
        return;
      }

      const fullText = item.line;
      let textOffset = 0;

      const lineLayouts: TextLineLayout[] = lines.map((line) => {
        const lineText = (line as unknown as { text?: string }).text;
        const lineWidth = line.width;

        let start: number;
        let end: number;
        let text: string;

        if (lineText) {
          start = textOffset;
          end = start + lineText.length;
          text = lineText;
          textOffset = end;

          // Skip whitespace
          while (
            textOffset < fullText.length &&
            (fullText[textOffset] === ' ' || fullText[textOffset] === '\n')
            ) {
            textOffset += 1;
          }
        } else {
          // Fallback estimation
          const avgCharWidth = lineWidth / Math.max(1, lineWidth / 20);
          const estimatedChars = Math.floor(lineWidth / avgCharWidth);

          start = textOffset;
          end = Math.min(start + estimatedChars, fullText.length);
          text = fullText.substring(start, end);
          textOffset = end;
        }

        return {
          start,
          end,
          text: text.trim() || fullText.substring(start, end),
          width: lineWidth,
          height: line.height,
        };
      });

      setTextLines(lineLayouts);
    },
    [item.line]
  );

  const containerStyle = useMemo(
    () => [styles.itemContainer, { opacity }],
    [opacity]
  );

  // Web version - simple rendering
  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={OPACITY}
          style={styles.textWrapper}
        >
          <Text
            style={
              isActive ? styles.lyricTextActive : styles.lyricTextStatic
            }
          >
            {item.line}
          </Text>
        </TouchableOpacity>
        {translation && (
          <Text style={styles.translationText}>{translation.text}</Text>
        )}
      </View>
    );
  }

  // Native version - karaoke effect
  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={OPACITY}
        style={styles.textWrapper}
      >
        {isActive ? (
          <TextHighlight
            text={item.line}
            textLines={textLines}
            progress={progress}
            onTextLayout={handleTextLayout}
          />
        ) : (
          <Text style={styles.lyricTextStatic}>{item.line}</Text>
        )}
      </TouchableOpacity>
      {translation && <Text style={styles.translationText}>{translation.text}</Text>}
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
  translationText: {
    marginTop: 8,
    fontSize: 20,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});

export default memo(LyricLine, (prevProps, nextProps) => {
  return (
    prevProps.item._id.$oid === nextProps.item._id.$oid &&
    prevProps.translationLang === nextProps.translationLang &&
    prevProps.index === nextProps.index &&
    prevProps.activeIndex === nextProps.activeIndex &&
    prevProps.progress === nextProps.progress
  );
});
