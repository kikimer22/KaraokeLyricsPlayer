import { useCallback, useMemo, useEffect } from 'react';
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

export default function App() {
  const {
    translationLang,
    isUserScrolling,
    activeIndex,
    currentTimeMs,
    setIsUserScrolling,
  } = useAppStore();

  const { play, toggle, seekTo } = useAudioPlayer({ data: SONG_DATA });

  useActiveIndex({ lyrics: SONG_DATA.lrc });

  const flatListRef = useAutoScroll({
    activeIndex,
    enabled: !isUserScrolling,
  });

  // Create shared value for current time (for animations)
  const currentTimeMsShared = useSharedValue(0);

  // Update shared value when currentTimeMs changes (outside render)
  useEffect(() => {
    currentTimeMsShared.value = currentTimeMs;
  }, [currentTimeMs, currentTimeMsShared]);

  // Create line-to-words mapping for richSync
  const lineWordsMap = useMemo(
    () => hasValidRichSync(SONG_DATA) ? createLineWordsLookup(SONG_DATA) : new Map(),
    []
  );

  const handleWordPress = useCallback(
    (timeMs: number) => {
      seekTo(timeMs);
      play();
    },
    [seekTo, play]
  );

  const handleLinePress = useCallback(
    (line: LrcLine) => {
      seekTo(line.milliseconds);
      play();
    },
    [seekTo, play]
  );

  const handleScrollBeginDrag = useCallback(() => {
    setIsUserScrolling(true);
  }, [setIsUserScrolling]);

  const handleMomentumScrollEnd = useCallback(() => {
    setTimeout(() => setIsUserScrolling(false), 1000);
  }, [setIsUserScrolling]);

  const renderItem = useCallback(
    ({ item, index }: { item: LrcLine; index: number }) => {
      const lineWords = getWordsForLine(lineWordsMap, item._id.$oid);

      return (
        <LyricLine
          item={item}
          translationLang={translationLang}
          index={index}
          activeIndex={activeIndex}
          currentTimeMs={currentTimeMsShared}
          lineWords={lineWords}
          onWordPress={handleWordPress}
          onLinePress={() => handleLinePress(item)}
        />
      );
    },
    [
      translationLang,
      activeIndex,
      currentTimeMsShared,
      lineWordsMap,
      handleWordPress,
      handleLinePress,
    ]
  );

  const keyExtractor = useCallback((item: LrcLine) => item._id.$oid, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const gradientMask = useMemo(
    () => (
      <LinearGradient
        colors={['transparent', 'black', 'black', 'transparent']}
        locations={[0, 0.2, 0.8, 1]}
        style={styles.linearGradient}
      />
    ),
    []
  );

  const flatListConfig = useMemo(
    () => ({
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
    }),
    [handleScrollBeginDrag, handleMomentumScrollEnd]
  );

  const renderLyricsList = useCallback(
    () => (
      <FlatList
        ref={flatListRef}
        data={SONG_DATA.lrc}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        {...flatListConfig}
      />
    ),
    [flatListRef, renderItem, keyExtractor, getItemLayout, flatListConfig]
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <Background uri={SONG_DATA.album.cover_xl} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ArtistCard
            uri={SONG_DATA.album.cover_xl}
            title={SONG_DATA.title}
            description={SONG_DATA.artist.name}
          />

          {Platform.OS === 'web' ? (
            <View style={styles.lyricsContainer}>{renderLyricsList()}</View>
          ) : (
            <MaskedView style={styles.lyricsContainer} maskElement={gradientMask}>
              {renderLyricsList()}
            </MaskedView>
          )}

          <PlayerControls onPlayPause={toggle} onSeek={seekTo} />

          <LanguageModal
            actualLanguage={SONG_DATA.musixmatch.lyrics.lyrics_language}
            languages={SONG_DATA.languages}
          />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  lyricsContainer: {
    flex: 1,
    width: '100%',
  },
  linearGradient: {
    flex: 1,
  },
});
