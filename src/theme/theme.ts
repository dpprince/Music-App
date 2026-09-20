import { Platform } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#09090C',
  bgElevated: '#111114',
  bgElevated2: '#1A1A1F',
  glass: 'rgba(24,24,29,0.78)',
  glassStrong: 'rgba(20,20,24,0.9)',
  hairline: 'rgba(255,255,255,0.12)',
  hairlineSoft: 'rgba(255,255,255,0.07)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9B9BA2',
  textTertiary: '#6B6B72',
  textDisabled: '#46464C',

  // Accent (Apple Music red gradient)
  accent: '#FA2949',
  accentSoft: '#FB5C74',
  accentDeep: '#D91E3E',
  gradientStart: '#FB5C74',
  gradientEnd: '#FA2949',
  love: '#FA6C7E',

  // Functional
  scrubberFill: '#FFFFFF',
  scrubberTrack: 'rgba(255,255,255,0.18)',
  thumb: '#FFFFFF',
  playlistCell: 'rgba(255,255,255,0.04)',

  segmentedActive: '#2C2C33',
  segmentedInactive: 'transparent',
} as const;

export const radius = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screen: 20,
} as const;

export const type = {
  giant: { fontSize: 42, lineHeight: 46, fontWeight: '700' as const },
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '800' as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  title2: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title3: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '500' as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 17, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  microCaps: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.2 } as const,
} as const;

export const font = Platform.select({
  ios: {
    base: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    base: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    base: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
}) as { base: string; serif: string; mono: string };

export const durations = {
  micro: 120,
  fast: 180,
  normal: 240,
  slow: 360,
} as const;

// Apple-style springs
export const springs = {
  springy: { damping: 18, stiffness: 320, mass: 0.9 },
  tappy: { damping: 20, stiffness: 500, mass: 0.6 },
  sheet: { damping: 28, stiffness: 260, mass: 0.9 },
  heavy: { damping: 24, stiffness: 190, mass: 1 },
} as const;

export const motion = {
  pressScale: 0.96,
  showScale: 1.02,
} as const;