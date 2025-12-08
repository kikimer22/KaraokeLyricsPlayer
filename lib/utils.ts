import type { LrcLine, SongData, WordEntry } from '@/lib/types';

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const findCurrentIndex = (
  lrc: readonly { milliseconds: number }[],
  currentTimeMs: number
): number => {
  let low = 0;
  let high = lrc.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const line = lrc[mid];
    const nextLine = lrc[mid + 1];

    if (currentTimeMs >= line.milliseconds && (!nextLine || currentTimeMs < nextLine.milliseconds)) {
      result = mid;
      break;
    }

    if (currentTimeMs < line.milliseconds) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};

export const mapWordsToLines = (
  lrcLines: readonly LrcLine[],
  richSyncWords: readonly WordEntry[]
): Map<string, WordEntry[]> => {
  const lineWordsMap = new Map<string, WordEntry[]>();

  if (!richSyncWords || richSyncWords.length === 0 || lrcLines.length === 0) {
    return lineWordsMap;
  }

  let currentLineWords: WordEntry[] = [];
  let lrcIndex = 0;

  for (const word of richSyncWords) {
    currentLineWords.push(word);

    if (word.isEndOfLine) {
      if (lrcIndex < lrcLines.length) {
        const lineId = lrcLines[lrcIndex]._id.$oid;
        lineWordsMap.set(lineId, [...currentLineWords]);
        lrcIndex++;
        currentLineWords = [];
      }
    }
  }

  if (currentLineWords.length > 0 && lrcIndex < lrcLines.length) {
    const lineId = lrcLines[lrcIndex]._id.$oid;
    lineWordsMap.set(lineId, currentLineWords);
  }

  return lineWordsMap;
};

export const findCurrentIndexByRichSync = (
  lineWordsMap: Map<string, WordEntry[]>,
  lrcLines: readonly LrcLine[],
  currentTimeMs: number
): number => {
  if (lineWordsMap.size === 0) {
    return findCurrentIndex(lrcLines, currentTimeMs);
  }

  for (let i = 0; i < lrcLines.length; i++) {
    const lineId = lrcLines[i]._id.$oid;
    const words = lineWordsMap.get(lineId);

    if (!words || words.length === 0) {
      continue;
    }

    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const lineStart = firstWord.start;
    const lineEnd = lastWord.end;

    if (currentTimeMs >= lineStart && currentTimeMs < lineEnd) {
      return i;
    }

    if (currentTimeMs >= lineEnd) {
      const nextLine = lrcLines[i + 1];
      if (nextLine) {
        const nextLineWords = lineWordsMap.get(nextLine._id.$oid);
        if (nextLineWords && nextLineWords.length > 0) {
          const nextLineStart = nextLineWords[0].start;
          if (currentTimeMs < nextLineStart) {
            return i;
          }
        } else {
          return i;
        }
      } else {
        return i;
      }
    }
  }

  return -1;
};

export const createLineWordsLookup = (
  songData: SongData
): Map<string, WordEntry[]> => {
  const richSyncWords = songData.richSync?.words ?? [];
  return mapWordsToLines(songData.lrc, richSyncWords);
};

export const hasValidRichSync = (songData: SongData): boolean => {
  return Boolean(
    songData.richSync?.words &&
    songData.richSync.words.length > 0 &&
    songData.richSync.status !== 'error'
  );
};

export const getWordsForLine = (
  lineWordsMap: Map<string, WordEntry[]>,
  lineId: string
): readonly WordEntry[] => {
  return lineWordsMap.get(lineId) ?? [];
};

