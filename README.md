# Karaoke Lyrics Player

A React Native app for displaying song lyrics in karaoke style with real-time word highlighting.

## Features

- 🎤 Real-time word-by-word text highlighting (richSync synchronization)
- 🌍 Multi-language translation support
- 📱 Cross-platform (iOS, Android)
- 🎨 Animated gradient text highlighting effect
- ↔️ RTL and LTR language support
- 🎚️ Audio player with playback controls and seek slider

## Tech Stack

- React Native 0.81
- Expo SDK 54
- React Native Reanimated
- TypeScript
- Zustand (state management)
- MaskedView + LinearGradient (highlight effect)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd KaraokeLyricsPlayer

# Install dependencies
npm install
```

## Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run in browser
npm run web
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server with cache clear |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run web version |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run type-check` | Run TypeScript type checking |

## Project Structure

```
├── App.tsx                 # Main component
├── lib/
│   ├── components/         # UI components
│   │   ├── ArtistCard.tsx
│   │   ├── Background.tsx
│   │   ├── LanguageModal.tsx
│   │   ├── LyricLine.tsx
│   │   ├── PlayerControls.tsx
│   │   └── TimedTextHighlight.tsx
│   ├── helpers/            # Helper functions
│   │   ├── textLayout.ts
│   │   └── translation.ts
│   ├── hooks/              # React hooks
│   │   ├── useActiveIndex.ts
│   │   ├── useAudioPlayer.ts
│   │   ├── useAutoScroll.ts
│   │   └── useTextHighlight.ts
│   ├── store/              # Zustand store
│   │   └── store.ts
│   ├── constants.ts        # Constants
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utilities
│   └── data.ts             # Song data
└── assets/                 # Static assets
```

## License

MIT

