import { type FC, memo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react-native';
import { formatTime } from '@/lib/utils';
import type { Languages } from '@/lib/types';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTimeMs: number;
  totalDurationMs: number;
  onSeek: (value: number) => void;
  setModalVisible: (value: boolean) => void;
  translationLang: Languages | null;
}

const PlayerControls: FC<PlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  currentTimeMs,
  totalDurationMs,
  onSeek,
  setModalVisible,
  translationLang
}: PlayerControlsProps) => {
  const [like, setLike] = useState(false);

  const handleLike = useCallback(() => {
    setLike(prev => !prev);
  }, [setLike]);

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
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTimeMs)}</Text>
          <Text style={styles.timeText}>-{formatTime(totalDurationMs - currentTimeMs)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLike}>
          {like ? (
            <Heart fill="#FFF" color="#FFF" size={28}/>
          ) : (
            <Heart color="#FFF" size={28}/>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <SkipBack color="#FFF" size={28}/>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playBtn} onPress={onPlayPause}>
          {isPlaying ? (
            <Pause color="#000" size={32} fill="#000"/>
          ) : (
            <Play color="#000" size={32} fill="#000" style={{ marginLeft: 4 }}/>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <SkipForward color="#FFF" size={28}/>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.secondaryBtn}>
          <Text style={styles.buttonText}>
            {translationLang ? translationLang.toUpperCase() : 'CC'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  }
});

export default memo(PlayerControls);
