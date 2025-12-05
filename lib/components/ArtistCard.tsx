import { View, Text, Image, StyleSheet } from 'react-native';
import { type FC, memo } from 'react';

interface ArtistCardProps {
  uri?: string;
  title: string;
  description: string;
}

const ArtistCard: FC<ArtistCardProps> = ({ uri, title, description }: ArtistCardProps) => {
  return (
    <View style={styles.header}>
      <Image
        source={{ uri }}
        style={styles.albumArt}
      />
      <View style={styles.songMeta}>
        <Text style={styles.songTitle}>{title}</Text>
        <Text style={styles.artistName}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
  },
  songMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  artistName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default memo(ArtistCard);
