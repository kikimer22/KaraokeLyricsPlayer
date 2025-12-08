import { create } from 'zustand';
import type { Languages } from '@/lib/types';
import { useShallow } from 'zustand/react/shallow';

interface PlayerState {
  // Player state
  isPlaying: boolean;
  currentTimeMs: number;
  activeIndex: number;
  totalDurationMs: number;

  // UI state
  translationLang: Languages | null;
  isModalVisible: boolean;
  isUserScrolling: boolean;

  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTimeMs: (time: number) => void;
  setActiveIndex: (index: number) => void;
  setTotalDurationMs: (time: number) => void;
  setTranslationLang: (lang: Languages | null) => void;
  setModalVisible: (visible: boolean) => void;
  setIsUserScrolling: (scrolling: boolean) => void;
}

const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentTimeMs: 0,
  activeIndex: -1,
  totalDurationMs: 0,
  translationLang: null,
  isModalVisible: false,
  isUserScrolling: false,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTimeMs: (time) => set({ currentTimeMs: time }),
  setActiveIndex: (index) => set({ activeIndex: index }),
  setTotalDurationMs: (time) => set({ totalDurationMs: time }),
  setTranslationLang: (lang) => set({ translationLang: lang }),
  setModalVisible: (visible) => set({ isModalVisible: visible }),
  setIsUserScrolling: (scrolling) => set({ isUserScrolling: scrolling }),
}));

export const useAppStore = () => usePlayerStore(useShallow(({
  translationLang,
  activeIndex,
  isUserScrolling,
  setIsUserScrolling,
}) => ({
  translationLang,
  activeIndex,
  isUserScrolling,
  setIsUserScrolling,
})));

export const useAudioPlayerStore = () => usePlayerStore(useShallow(({
  isPlaying,
  setIsPlaying,
  setCurrentTimeMs,
  setTotalDurationMs
}) => ({
  isPlaying,
  setIsPlaying,
  setCurrentTimeMs,
  setTotalDurationMs
})));

export const useLanguageModalStore = () => usePlayerStore(useShallow(({
  isModalVisible,
  setModalVisible,
  translationLang,
  setTranslationLang,
}) => ({
  isModalVisible,
  setModalVisible,
  translationLang,
  setTranslationLang,
})));

export const useActiveIndexStore = () => usePlayerStore(useShallow(({
  currentTimeMs,
  setActiveIndex,
}) => ({
  currentTimeMs,
  setActiveIndex,
})));

export const useLineProgressStore = () => usePlayerStore(useShallow(({
  currentTimeMs,
  activeIndex,
  isPlaying,
}) => ({
  currentTimeMs,
  activeIndex,
  isPlaying,
})));

export const usePlayerControlsStore = () => usePlayerStore(useShallow(({
  isPlaying,
  currentTimeMs,
  translationLang,
  totalDurationMs,
  setModalVisible,
}) => ({
  isPlaying,
  currentTimeMs,
  translationLang,
  totalDurationMs,
  setModalVisible,
})));
