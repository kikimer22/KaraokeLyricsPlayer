import { useCallback, useMemo, useRef } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useSharedValue } from 'react-native-reanimated';

import { SONG_DATA } from '@/lib/data';
import LyricLine from '@/lib/components/LyricLine';
import PlayerControls from '@/lib/components/PlayerControls';
import Background from '@/lib/components/Background';
import ArtistCard from '@/lib/components/ArtistCard';
import LanguageModal from '@/lib/components/LanguageModal';

import { ITEM_HEIGHT } from '@/lib/constants';
import type { LrcLine } from '@/lib/types';
import { createLineWordsLookup, getWordsForLine, hasValidRichSync } from '@/lib/utils';

import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import { useActiveIndex } from '@/lib/hooks/useActiveIndex';
import { useAutoScroll } from '@/lib/hooks/useAutoScroll';
import { useAppStore } from '@/lib/store/store';

const SCROLL_RESET_DELAY = 1000;
const GRADIENT_MASK_COLORS = ['transparent', 'black', 'black', 'transparent'] as const;
const GRADIENT_MASK_LOCATIONS = [0, 0.2, 0.8, 1] as const;

export default function App() {
  const { translationLang, isUserScrolling, activeIndex, setIsUserScrolling } = useAppStore();
  const currentTimeMsShared = useSharedValue(0);

  const { play, toggle, seekTo } = useAudioPlayer({
    data: SONG_DATA,
    onTimeUpdate: (timeMs) => { currentTimeMsShared.value = timeMs; },
  });

  const lineWordsMap = useMemo(
    () => (hasValidRichSync(SONG_DATA) ? createLineWordsLookup(SONG_DATA) : new Map()),
    []
  );

  useActiveIndex({ lyrics: SONG_DATA.lrc, lineWordsMap });

  const flatListRef = useAutoScroll({ activeIndex, enabled: !isUserScrolling });

  const handleWordPress = useCallback((timeMs: number) => {
    currentTimeMsShared.value = timeMs;
    seekTo(timeMs);
    play();
  }, [seekTo, play, currentTimeMsShared]);

  const handleSeek = useCallback((timeMs: number) => {
    currentTimeMsShared.value = timeMs;
    seekTo(timeMs);
  }, [seekTo, currentTimeMsShared]);

  const linePressHandlers = useRef<Map<string, () => void>>(new Map());

  const getLinePressHandler = useCallback((line: LrcLine) => {
    const id = line._id.$oid;
    if (!linePressHandlers.current.has(id)) {
      linePressHandlers.current.set(id, () => {
        const words = getWordsForLine(lineWordsMap, id);
        seekTo(words.length ? words[0].start : line.milliseconds);
        play();
      });
    }
    return linePressHandlers.current.get(id)!;
  }, [seekTo, play, lineWordsMap]);

  const handleScrollBeginDrag = useCallback(() => setIsUserScrolling(true), [setIsUserScrolling]);
  const handleMomentumScrollEnd = useCallback(() => {
    setTimeout(() => setIsUserScrolling(false), SCROLL_RESET_DELAY);
  }, [setIsUserScrolling]);

  const renderItem = useCallback(({ item, index }: { item: LrcLine; index: number }) => (
    <LyricLine
      item={item}
      translationLang={translationLang}
      isActive={index === activeIndex}
      onLinePress={getLinePressHandler(item)}
      lineWords={getWordsForLine(lineWordsMap, item._id.$oid)}
      currentTimeMs={currentTimeMsShared}
      onWordPress={handleWordPress}
    />
  ), [translationLang, activeIndex, lineWordsMap, getLinePressHandler, currentTimeMsShared, handleWordPress]);

  const keyExtractor = useCallback((item: LrcLine) => item._id.$oid, []);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const flatListConfig = {
    snapToInterval: ITEM_HEIGHT,
    snapToAlignment: 'center' as const,
    showsVerticalScrollIndicator: false,
    windowSize: 7,
    initialNumToRender: 5,
    maxToRenderPerBatch: 3,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: Platform.OS === 'android',
    onScrollBeginDrag: handleScrollBeginDrag,
    onMomentumScrollEnd: handleMomentumScrollEnd,
  };

  const lyricsList = (
    <FlatList
      ref={flatListRef}
      data={SONG_DATA.lrc}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      {...flatListConfig}
    />
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Background uri={SONG_DATA.album.cover_xl} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ArtistCard uri={SONG_DATA.album.cover_xl} title={SONG_DATA.title} description={SONG_DATA.artist.name} />

          {Platform.OS === 'web' ? (
            <View style={styles.lyricsContainer}>{lyricsList}</View>
          ) : (
            <MaskedView
              style={styles.lyricsContainer}
              maskElement={
                <LinearGradient colors={[...GRADIENT_MASK_COLORS]} locations={[...GRADIENT_MASK_LOCATIONS]} style={styles.gradient} />
              }
            >
              {lyricsList}
            </MaskedView>
          )}

          <PlayerControls onPlayPause={toggle} onSeek={handleSeek} />
          <LanguageModal actualLanguage={SONG_DATA.musixmatch.lyrics.lyrics_language} languages={SONG_DATA.languages} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  safeArea: { flex: 1 },
  lyricsContainer: { flex: 1, width: '100%' },
  gradient: { flex: 1 },
});
