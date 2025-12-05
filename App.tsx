import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SONG_DATA } from '@/lib/data';
import LyricLine from '@/lib/components/LyricLine';
import { ITEM_HEIGHT } from '@/lib/constants';
import type { Languages, LrcLine } from '@/lib/types';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import PlayerControls from '@/lib/components/PlayerControls';
import Background from '@/lib/components/Background';
import ArtistCard from '@/lib/components/ArtistCard';
import LanguageModal from '@/lib/components/Modal';
import { findCurrentIndex } from '@/lib/utils';
import { useLineProgress } from '@/lib/hooks/useLineProgress';
import { useScroll } from '@/lib/hooks/useScroll';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  const [translationLang, setTranslationLang] = useState<Languages | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const isUserScrolling = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const { currentTimeMs, totalDurationMs, isPlaying, play, pause, seekTo } = useAudioPlayer(SONG_DATA);
  // Added debounce via currentSecond for findCurrentIndex (reduced calls)
  const currentSecond = useMemo(() => Math.floor(currentTimeMs / 1000), [currentTimeMs]);
  const activeIndex = useMemo(() => findCurrentIndex(SONG_DATA.lrc, currentTimeMs), [currentSecond]);
  useScroll({ activeIndex, isUserScrolling, flatListRef });
  const { lineProgress } = useLineProgress({ data: SONG_DATA, currentTimeMs, activeIndex, isPlaying });

  const handleSeek = useCallback((value: number) => {
    seekTo(value);
  }, [seekTo]);

  const handlePlayPause = useCallback(() => {
    (isPlaying ? pause : play)();
  }, [isPlaying, pause, play]);

  const handleLinePress = useCallback((line: LrcLine) => {
    seekTo(line.milliseconds);
    play();
  }, [seekTo, play]);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    setTimeout(() => { isUserScrolling.current = false; }, 1000);
  }, []);

  const renderItem = ({ item, index }: { item: LrcLine, index: number }) => (
    <LyricLine
      item={item}
      translationLang={translationLang}
      index={index}
      activeIndex={activeIndex}
      progress={lineProgress}
      onPress={() => handleLinePress(item)}
    />
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content"/>

        {/* Background Image with Blur */}
        <Background uri={SONG_DATA.album.cover_xl}/>

        <SafeAreaView style={styles.safeArea}>
          {/* Header: Song Info */}
          <ArtistCard
            uri={SONG_DATA.album.cover_xl}
            title={SONG_DATA.title}
            description={SONG_DATA.artist.name}
          />

          {/* Lyrics Container */}
          {Platform.OS === 'web' ? (
            <View style={styles.lyricsContainer}>
              <FlatList
                ref={flatListRef}
                data={SONG_DATA.lrc}
                renderItem={renderItem}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                keyExtractor={(item) => item._id.$oid}
                getItemLayout={(_, index) => (
                  { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                )}
                onScrollBeginDrag={handleScrollBeginDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                showsVerticalScrollIndicator={false}
                windowSize={7}
                initialNumToRender={5}
                maxToRenderPerBatch={3}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
              />
            </View>
          ) : (
            <MaskedView
              style={styles.lyricsContainer}
              maskElement={
                <LinearGradient
                  colors={['transparent', 'black', 'black', 'transparent']}
                  locations={[0, 0.2, 0.8, 1]}
                  style={styles.linearGradient}
                />
              }
            >
              <FlatList
                ref={flatListRef}
                data={SONG_DATA.lrc}
                renderItem={renderItem}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="center"
                keyExtractor={(item) => item._id.$oid}
                getItemLayout={(_, index) => (
                  { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                )}
                onScrollBeginDrag={handleScrollBeginDrag}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                showsVerticalScrollIndicator={false}
                windowSize={7}
                initialNumToRender={5}
                maxToRenderPerBatch={3}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
              />
            </MaskedView>
          )}

          {/* Controls */}
          <PlayerControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTimeMs={currentTimeMs}
            totalDurationMs={totalDurationMs}
            onSeek={handleSeek}
            setModalVisible={setModalVisible}
            translationLang={translationLang}
          />

          {/* Language Modal */}
          <LanguageModal
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
            actualLanguage={SONG_DATA.musixmatch.lyrics.lyrics_language}
            languages={SONG_DATA.languages}
            translationLang={translationLang}
            setTranslationLang={setTranslationLang}
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 10,
    position: 'absolute',
    top: 40,
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
