import { type FC, memo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react-native';
import { formatTime } from '@/lib/utils';
import { usePlayerControlsStore } from '@/lib/store/store';

interface PlayerControlsProps {
  readonly onPlayPause: () => void;
  readonly onSeek: (value: number) => void;
  readonly onSkipBack?: () => void;
  readonly onSkipForward?: () => void;
}

const PlayerControls: FC<PlayerControlsProps> = memo(
  ({
    onPlayPause,
    onSeek,
    onSkipBack,
    onSkipForward,
  }) => {
    const [isLiked, setIsLiked] = useState(false);
    const {
      isPlaying,
      currentTimeMs,
      translationLang,
      totalDurationMs,
      setModalVisible,
    } = usePlayerControlsStore();

    const formattedCurrentTime = formatTime(currentTimeMs);
    const formattedRemainingTime = formatTime(totalDurationMs - currentTimeMs);

    const handleModalOpen = useCallback(() => {
      setModalVisible(true);
    }, [setModalVisible]);

    const handleLike = useCallback(() => {
      setIsLiked((prev) => !prev);
    }, []);

    return (
      <View style={styles.container}>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={totalDurationMs}
            value={currentTimeMs}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#FFFFFF"
            tapToSeek
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formattedCurrentTime}</Text>
            <Text style={styles.timeText}>-{formattedRemainingTime}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {/* like */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleLike}
            accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
            accessibilityRole="button"
          >
            <Heart
              fill={isLiked ? '#FFF' : 'none'}
              color="#FFF"
              size={28}
            />
          </TouchableOpacity>

          {/* back */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSkipBack}
            disabled={!onSkipBack}
            accessibilityLabel="Skip back"
            accessibilityRole="button"
          >
            <SkipBack color="#FFF" size={28}/>
          </TouchableOpacity>

          {/* Play or Pause */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={onPlayPause}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            accessibilityRole="button"
          >
            {isPlaying ? (
              <Pause color="#000" size={32} fill="#000"/>
            ) : (
              <Play color="#000" size={32} fill="#000" style={{ marginLeft: 4 }}/>
            )}
          </TouchableOpacity>

          {/* next */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSkipForward}
            disabled={!onSkipForward}
            accessibilityLabel="Skip forward"
            accessibilityRole="button"
          >
            <SkipForward color="#FFF" size={28}/>
          </TouchableOpacity>

          {/* translation */}
          <TouchableOpacity
            onPress={handleModalOpen}
            style={styles.secondaryBtn}
            accessibilityLabel="Translation settings"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {translationLang ? translationLang.toUpperCase() : 'CC'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

PlayerControls.displayName = 'PlayerControls';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    width: '100%',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default PlayerControls;
