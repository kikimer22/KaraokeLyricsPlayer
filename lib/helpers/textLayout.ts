import type { TextLayoutEventData } from 'react-native';
import type { WordEntry } from '@/lib/types';

export interface LineLayout {
  readonly index: number;
  readonly width: number;
  readonly height: number;
  readonly startChar: number;
  readonly endChar: number;
  readonly x: number;
  readonly y: number;
}

export interface WordMapping {
  readonly index: number;
  readonly word: WordEntry;
  readonly startChar: number;
  readonly endChar: number;
  readonly text: string;
}

const APOSTROPHE_REGEX = /[\u2018\u2019']/g;
const LEADING_PUNCT_REGEX = /^[^\w']+/;
const TRAILING_PUNCT_REGEX = /[^\w']+$/;
const WORD_CHAR_REGEX = /[\w']/;

const normalize = (str: string): string => str.toLowerCase().replace(APOSTROPHE_REGEX, "'");

const stripPunctuation = (str: string, leading = true, trailing = true): string => {
  let result = str;
  if (leading) result = result.replace(LEADING_PUNCT_REGEX, '');
  if (trailing) result = result.replace(TRAILING_PUNCT_REGEX, '');
  return result;
};

const findWordPosition = (text: string, word: string, cursor: number): number => {
  const textNorm = normalize(text);
  const wordNorm = normalize(word);

  const direct = textNorm.indexOf(wordNorm, cursor);
  if (direct >= 0) return direct;

  const stripped = stripPunctuation(wordNorm);
  if (stripped && stripped !== wordNorm) {
    const found = textNorm.indexOf(stripped, cursor);
    if (found >= 0) return found;
  }

  if (stripped) {
    for (let i = cursor; i < text.length; i++) {
      if (WORD_CHAR_REGEX.test(textNorm[i]) && textNorm.startsWith(stripped, i)) {
        return i;
      }
    }
  }

  return -1;
};

export const mapWordsToChars = (text: string, words: readonly WordEntry[]): readonly WordMapping[] => {
  if (!text || !words.length) return [];

  const textNorm = normalize(text);
  const mappings: WordMapping[] = [];
  let cursor = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const token = word.punctuatedWord || word.word;
    const baseWord = word.word;

    if (!token && !baseWord) {
      mappings.push({ index: i, word, startChar: cursor, endChar: cursor, text: '' });
      continue;
    }

    let pos = findWordPosition(text, token, cursor);
    if (pos === -1) pos = findWordPosition(text, baseWord, cursor);

    const startChar = pos >= 0 ? pos : cursor;
    const coreWord = stripPunctuation(normalize(baseWord));

    let endChar = startChar;
    if (pos >= 0 && coreWord) {
      let matchEnd = startChar;
      for (let j = startChar; j < text.length; j++) {
        if (WORD_CHAR_REGEX.test(textNorm[j])) {
          matchEnd = j + 1;
        } else if (matchEnd > startChar && textNorm.slice(startChar, matchEnd).includes(coreWord)) {
          break;
        }
      }
      endChar = Math.max(startChar + coreWord.length, matchEnd);
    } else {
      endChar = startChar + baseWord.length;
    }

    mappings.push({ index: i, word, startChar, endChar, text: token });
    cursor = Math.max(cursor + 1, endChar);
  }

  return mappings;
};

export const parseTextLayoutLines = (lines?: TextLayoutEventData['lines']): readonly LineLayout[] => {
  if (!lines?.length) return [];

  let offset = 0;
  return lines.map((line, index) => {
    const startChar = offset;
    offset += line.text.length;
    return { index, width: line.width, height: line.height, startChar, endChar: offset, x: line.x, y: line.y };
  });
};

export const getLineAtPosition = (y: number, lines: readonly LineLayout[]): LineLayout | null => {
  if (!lines.length) return null;

  for (const line of lines) {
    if (y >= line.y && y < line.y + line.height) return line;
  }

  return y < lines[0].y ? lines[0] : lines[lines.length - 1];
};

export const estimateCharPosition = (x: number, line: LineLayout, isRTL: boolean): number => {
  const relativeX = Math.max(0, Math.min(x - line.x, line.width));
  const ratio = line.width > 0 ? relativeX / line.width : 0;
  const position = isRTL ? 1 - ratio : ratio;
  return Math.floor(line.startChar + (line.endChar - line.startChar) * position);
};

export const findClosestWordInLine = (
  charPos: number,
  line: LineLayout,
  mappings: readonly WordMapping[]
): WordMapping => {
  const lineWords = mappings.filter(m => m.startChar < line.endChar && m.endChar > line.startChar);

  if (!lineWords.length) {
    return mappings.reduce((closest, m) => {
      const dist = Math.abs(charPos - (m.startChar + m.endChar) / 2);
      const closestDist = Math.abs(charPos - (closest.startChar + closest.endChar) / 2);
      return dist < closestDist ? m : closest;
    }, mappings[0]);
  }

  if (lineWords.length === 1) return lineWords[0];

  const clampedPos = Math.max(line.startChar, Math.min(line.endChar - 1, charPos));

  for (let i = 0; i < lineWords.length; i++) {
    const current = lineWords[i];
    const next = lineWords[i + 1];
    const rangeEnd = next ? Math.max(current.endChar, next.startChar) : line.endChar;

    if (clampedPos >= Math.max(current.startChar, line.startChar) && clampedPos < rangeEnd) {
      return current;
    }
  }

  return clampedPos >= lineWords[lineWords.length - 1].startChar
    ? lineWords[lineWords.length - 1]
    : lineWords[0];
};
