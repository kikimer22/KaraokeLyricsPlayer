import type { LrcLine, SongData, WordEntry } from '@/lib/types';

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const findCurrentIndex = (lrc: readonly { milliseconds: number }[], timeMs: number): number => {
  let low = 0;
  let high = lrc.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const current = lrc[mid];
    const next = lrc[mid + 1];

    if (timeMs >= current.milliseconds && (!next || timeMs < next.milliseconds)) {
      return mid;
    }

    if (timeMs < current.milliseconds) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return -1;
};

export const mapWordsToLines = (
  lines: readonly LrcLine[],
  words: readonly WordEntry[]
): Map<string, WordEntry[]> => {
  const map = new Map<string, WordEntry[]>();
  if (!words.length || !lines.length) return map;

  let currentWords: WordEntry[] = [];
  let lineIdx = 0;

  for (const word of words) {
    currentWords.push(word);

    if (word.isEndOfLine && lineIdx < lines.length) {
      map.set(lines[lineIdx]._id.$oid, [...currentWords]);
      lineIdx++;
      currentWords = [];
    }
  }

  if (currentWords.length && lineIdx < lines.length) {
    map.set(lines[lineIdx]._id.$oid, currentWords);
  }

  return map;
};

export const findCurrentIndexByRichSync = (
  wordsMap: Map<string, WordEntry[]>,
  lines: readonly LrcLine[],
  timeMs: number
): number => {
  if (!wordsMap.size) return findCurrentIndex(lines, timeMs);

  for (let i = 0; i < lines.length; i++) {
    const words = wordsMap.get(lines[i]._id.$oid);
    if (!words?.length) continue;

    const lineStart = words[0].start;
    const lineEnd = words[words.length - 1].end;

    if (timeMs >= lineStart && timeMs < lineEnd) return i;

    if (timeMs >= lineEnd) {
      const nextWords = lines[i + 1] && wordsMap.get(lines[i + 1]._id.$oid);
      if (!nextWords?.length || timeMs < nextWords[0].start) return i;
    }
  }

  return -1;
};

export const createLineWordsLookup = (data: SongData): Map<string, WordEntry[]> =>
  mapWordsToLines(data.lrc, data.richSync?.words ?? []);

export const hasValidRichSync = (data: SongData): boolean =>
  Boolean(data.richSync?.words?.length && data.richSync.status !== 'error');

export const getWordsForLine = (map: Map<string, WordEntry[]>, lineId: string): readonly WordEntry[] =>
  map.get(lineId) ?? [];
