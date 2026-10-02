export const colors = {
  background: '#fffbea',
  ink: '#1d3039',
  muted: '#718189',
  green: '#005b52',
  mint: '#d8f1e5',
  focusBackground: '#fffbea',
  progressBackground: '#ffe5bf',
  lilac: '#ebe5ff',
  peach: '#ffe9df',
  rose: '#ffc7d6',
  line: '#ece7e4',
  white: '#ffffff',
  surface: '#fffef4',
};

export const cartoon = {
  outline: '#005b52',
  sunshine: '#fff0aa',
  sky: '#a8e6e4',
  peach: '#ffe4cd',
  mint: '#cef3da',
  lilac: '#e4dcff',
};

export type ThemeMode = 'day' | 'evening' | 'forest' | 'night';

export const themeOptions: {mode: ThemeMode; label: string; description: string}[] = [
  {mode: 'day', label: 'Day', description: 'Bright skies and fresh greens'},
  {mode: 'evening', label: 'Evening', description: 'Sunset over warm sand'},
  {mode: 'forest', label: 'Forest', description: 'Cool shade and leafy paths'},
  {mode: 'night', label: 'Night', description: 'A moonlit city stroll'},
];

export const themePalettes = {
  day: {sky: '#75d6fb', ground: '#0ba66c', screen: colors.background, focus: colors.focusBackground, progress: colors.progressBackground, dock: colors.green, energyTrack: '#e0f9d4', energyFill: '#008a53', offendersCard: '#0c8b58', metricCards: ['#ffe4cd', '#cef3da', '#e4dcff'], actionCards: ['#cef3da', '#ffe4cd'], heading: colors.ink, statusBar: 'dark-content' as const},
  evening: {sky: '#ed9fa4', ground: '#ad805d', screen: '#fff0df', focus: '#fff0e3', progress: '#fbdccf', dock: '#704d61', energyTrack: '#f9e8cd', energyFill: '#79545f', offendersCard: '#865f54', metricCards: ['#ffe3c7', '#f9d9c5', '#eed6dc'], actionCards: ['#f6dfc6', '#ffe3d0'], heading: colors.ink, statusBar: 'dark-content' as const},
  forest: {sky: '#93dcf0', ground: '#1b8071', screen: '#e3f2e7', focus: '#e7f3e8', progress: '#d9eee7', dock: '#155d58', energyTrack: '#d9f5db', energyFill: '#116f63', offendersCard: '#17685e', metricCards: ['#d8f3df', '#c5ebd7', '#dcefe8'], actionCards: ['#d4f0dc', '#e1efcf'], heading: colors.ink, statusBar: 'dark-content' as const},
  night: {sky: '#273b79', ground: '#55576d', screen: '#d8ddf0', focus: '#dce1f3', progress: '#cbd5ed', dock: '#2b3551', energyTrack: '#dce7ff', energyFill: '#6e9fbd', offendersCard: '#4a6480', metricCards: ['#e0d9eb', '#d2dbea', '#e2ddec'], actionCards: ['#d4dcea', '#e6dce8'], heading: colors.ink, statusBar: 'light-content' as const},
};
