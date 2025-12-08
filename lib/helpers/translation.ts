import type { Languages, WordEntry } from '@/lib/types';

const RTL_LANGUAGES = new Set<Languages>(['he']);

export const buildTranslationWordTimings = (
  translationText: string | undefined,
  sourceWords: readonly WordEntry[]
): readonly WordEntry[] => {
  const trimmed = translationText?.trim();
  if (!trimmed || !sourceWords.length) return [];

  const tokens = trimmed.split(/\s+/);
  if (!tokens.length) return [];

  const ratio = sourceWords.length / tokens.length;

  return tokens.map((token, idx) => {
    const sourceIdx = Math.min(sourceWords.length - 1, Math.floor(idx * ratio));
    const source = sourceWords[sourceIdx];
    return {
      ...source,
      word: token,
      punctuatedWord: token,
      isEstimatedTiming: true,
      isEndOfLine: idx === tokens.length - 1,
    } as WordEntry;
  });
};

export const isRtlLanguage = (lang: Languages | null): boolean =>
  lang !== null && RTL_LANGUAGES.has(lang);
