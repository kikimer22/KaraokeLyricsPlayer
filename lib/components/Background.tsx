import { Image, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { type FC, memo } from 'react';

interface BackgroundProps {
  uri?: string;
}

const Background: FC<BackgroundProps> = ({ uri }: BackgroundProps) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}/>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

export default memo(Background);
