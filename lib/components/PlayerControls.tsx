import { type FC, memo, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react-native';
import { formatTime } from '@/lib/utils';
import { usePlayerControlsStore, useTimeDisplayStore, useControlsButtonsStore } from '@/lib/store/store';

const TimeDisplay = memo(() => {
  const { currentTimeMs, totalDurationMs } = useTimeDisplayStore();
  const formattedCurrentTime = formatTime(currentTimeMs);
  const formattedRemainingTime = formatTime(totalDurationMs - currentTimeMs);

  return (
    <View style={styles.timeContainer}>
      <Text style={styles.timeText}>{formattedCurrentTime}</Text>
      <Text style={styles.timeText}>-{formattedRemainingTime}</Text>
    </View>
  );
});

TimeDisplay.displayName = 'TimeDisplay';

const SlidingTimeDisplay = memo(({ value, totalDurationMs }: { value: number; totalDurationMs: number }) => {
  const formattedCurrentTime = formatTime(value);
  const formattedRemainingTime = formatTime(totalDurationMs - value);

  return (
    <View style={styles.timeContainer}>
      <Text style={styles.timeText}>{formattedCurrentTime}</Text>
      <Text style={styles.timeText}>-{formattedRemainingTime}</Text>
    </View>
  );
});

SlidingTimeDisplay.displayName = 'SlidingTimeDisplay';

const ControlButtons = memo(({
  onPlayPause,
  onSkipBack,
  onSkipForward,
}: {
  onPlayPause: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const { isPlaying, translationLang, setModalVisible } = useControlsButtonsStore();

  const handleModalOpen = useCallback(() => {
    setModalVisible(true);
  }, [setModalVisible]);

  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
  }, []);

  return (
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={handleLike}
        accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
        accessibilityRole="button"
      >
        <Heart fill={isLiked ? '#FFF' : 'none'} color="#FFF" size={28} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onSkipBack}
        disabled={!onSkipBack}
        accessibilityLabel="Skip back"
        accessibilityRole="button"
      >
        <SkipBack color="#FFF" size={28} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.playBtn}
        onPress={onPlayPause}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        {isPlaying ? (
          <Pause color="#000" size={32} fill="#000" />
        ) : (
          <Play color="#000" size={32} fill="#000" style={{ marginLeft: 4 }} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onSkipForward}
        disabled={!onSkipForward}
        accessibilityLabel="Skip forward"
        accessibilityRole="button"
      >
        <SkipForward color="#FFF" size={28} />
      </TouchableOpacity>

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
  );
});

ControlButtons.displayName = 'ControlButtons';

interface PlayerControlsProps {
  readonly onPlayPause: () => void;
  readonly onSeek: (value: number) => void;
  readonly onSkipBack?: () => void;
  readonly onSkipForward?: () => void;
}

const PlayerControls: FC<PlayerControlsProps> = ({
  onPlayPause,
  onSeek,
  onSkipBack,
  onSkipForward,
}) => {
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const { currentTimeMs, totalDurationMs } = usePlayerControlsStore();
  const currentTimeMsRef = useRef(currentTimeMs);
  currentTimeMsRef.current = currentTimeMs;

  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
    setSliderValue(currentTimeMsRef.current);
  }, []);

  const handleValueChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleSlidingComplete = useCallback((value: number) => {
    setIsSliding(false);
    onSeek(value);
  }, [onSeek]);

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={totalDurationMs}
          value={isSliding ? sliderValue : currentTimeMs}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
          thumbTintColor="#FFFFFF"
          tapToSeek
        />
        {isSliding ? (
          <SlidingTimeDisplay value={sliderValue} totalDurationMs={totalDurationMs} />
        ) : (
          <TimeDisplay />
        )}
      </View>

      <ControlButtons
        onPlayPause={onPlayPause}
        onSkipBack={onSkipBack}
        onSkipForward={onSkipForward}
      />
    </View>
  );
};

PlayerControls.displayName = 'PlayerControls';

export default memo(PlayerControls);

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

