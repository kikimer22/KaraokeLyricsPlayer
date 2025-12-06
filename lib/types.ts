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

export interface RichSync {
  metadata: Metadata;
  status: 'needsReview' | 'reviewed' | 'inProgress' | 'error' | string;
  accuracy: 'unknown' | 'low' | 'medium' | 'high' | string;
  words: WordEntry[];
  _id: ObjectIdLike;
  createdAt: DateLike;
  updatedAt: DateLike;
}

export interface Metadata {
  modelAlignmentSummary: ModelAlignmentSummary;
  fallbackStats?: FallbackStats;
  youtubeVideoId?: string;
}

export interface ModelAlignmentSummary {
  // Dynamic collection of providers/models, keyed by "<provider>_<modelName>"
  [key: string]: ProviderModelAlignment;
}

export interface ProviderModelAlignment {
  provider: string; // e.g., 'elevenLabs', 'deepGram'
  model: string;    // e.g., 'scribe_v1', 'nova-3', 'enhanced'
  transcriptId: string | null;
  totalWordsReceived: number;
  totalWordsAssigned: number;
  alignmentByN?: Record<string, number>; // e.g., { '1': 5, '2': 30, ... }
}

export interface FallbackStats {
  autoAlignedCount: number;
}

export interface WordEntry {
  word: string;                 // raw word
  start: number;                // ms start
  end: number;                  // ms end
  punctuatedWord?: string;      // e.g., "There's"
  isEstimatedTiming: boolean;
  isEndOfLine: boolean;
  metadata?: WordMetadata;
  _id?: ObjectIdLike;
}

export interface WordMetadata {
  deepGram?: {
    dgAlignedNgram?: string[];
    lrcAlignedNgram?: string[];
  };
  manual?: {
    manuallyUpdated: boolean;
    updatedFields?: string[];
  };
}

export interface ObjectIdLike {
  $oid: string;
}

export interface DateLike {
  $date: string; // ISO 8601
}

export interface SongData {
  title: string;
  artist: Artist;
  album: Album;
  lrc: LrcLine[];
  deezer: DeezerData;
  primaryGenres?: any[];
  languages: Languages[];
  richSync: RichSync;
  musixmatch: {
    lyrics: {
      lyrics_language: Languages;
    }
  };
}
