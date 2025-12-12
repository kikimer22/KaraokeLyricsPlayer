import { Platform } from 'react-native';

export const ITEM_HEIGHT = 260;
export const OPACITY = 0.7;
export const LYRIC_LINE_HEIGHT = 44;
export const TRANSLATION_LINE_HEIGHT = 30;
export const LYRIC_FONT_SIZE = 32;
export const TRANSLATION_FONT_SIZE = 20;
export const GRADIENT_COLORS = ['#FFD700', '#FFA500', '#FF6B35'] as const;
export const GRADIENT_OVERDRAW_PX = Platform.OS === 'android' ? 8 : 2;
export const OPACITY_TRANSITION_DURATION = 200;
export const TICK_INTERVAL_MS = 50;
export const RAF_THROTTLE_MS = 16;
export const AUTO_SCROLL_DELAY_MS = 150;
