export type Languages = 'en' | 'es' | 'he' | 'ko' | 'pt' | 'pl' | 'az' | 'fr' | 'th';

export interface Translation {
  text: string;
}

export type TranslationsMap = Record<Languages, Translation>;

export interface LrcLine {
  _id: { $oid: string };
  line: string;
  milliseconds: number;
  duration: number;
  translations: TranslationsMap;
}

export interface Artist {
  name: string;
  picture: string;
}

export interface Album {
  title: string;
  cover: string;
  cover_xl?: string;
}

export interface DeezerData {
  duration: number; // in seconds
}

export interface SongData {
  title: string;
  artist: Artist;
  album: Album;
  lrc: LrcLine[];
  deezer: DeezerData;
  primaryGenres?: any[];
  languages: Languages[];
  musixmatch: {
    lyrics: {
      lyrics_language: Languages;
    }
  };
}
