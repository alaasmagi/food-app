/** Dark-only theme tokens for the mobile app. */

const neutral = {
  neutral0: '#121518',
  neutral1: '#1B2025',
  neutral2: '#232A31',
  neutral3: '#2F363E',
  neutral4: '#49515A',
  neutral5: '#677079',
  neutral6: '#848D97',
  neutral7: '#A8B6C2',
  neutral8: '#D1D9DF',
  neutral9: '#F6F9FB',
} as const;

const accent = {
  accent9: '#53F4C3',
  accent7: '#34E6B5',
  accent6: '#11CFA1',
  accent5: '#00B389',
  accent3: '#004431',
  accent2: '#022C20',
} as const;

const gold = {
  gold9: '#DBB242',
  gold7: '#C39806',
  gold6: '#AF8600',
  gold3: '#483500',
  gold2: '#2E2202',
} as const;

const status = {
  success7: '#53BE70',
  success3: '#083818',
  warning7: '#FFB454',
  warning3: '#442600',
  danger7: '#FF5C7A',
  danger3: '#550F1F',
} as const;

const data = {
  price7: '#FFD166',
} as const;

export const colors = {
  ...neutral,
  ...accent,
  ...gold,
  ...status,
  ...data,

  surfaceApp: neutral.neutral0,
  surfaceRaised: neutral.neutral1,
  surfaceCard: neutral.neutral2,
  surfaceHover: neutral.neutral3,
  surfaceOverlay: 'rgba(18, 21, 24, 0.8)',

  borderSubtle: neutral.neutral4,
  borderStrong: neutral.neutral5,
  borderFocus: accent.accent7,

  textPrimary: neutral.neutral9,
  textSecondary: neutral.neutral7,
  textDisabled: neutral.neutral6,
  textOnAccent: '#03160F',
  textLink: accent.accent9,
  textLinkHover: '#88FBD4',

  actionPrimary: accent.accent7,
  actionPrimaryHover: accent.accent6,
  actionPrimaryPress: accent.accent5,
  actionPrimaryText: '#03160F',

  accentGold: gold.gold7,
  price: data.price7,

  statusSuccess: status.success7,
  statusSuccessBg: status.success3,
  statusWarning: status.warning7,
  statusWarningBg: status.warning3,
  statusDanger: status.danger7,
  statusDangerBg: status.danger3,
} as const;

export const fonts = {
  display: 'Figtree_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemibold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'JetBrainsMono_400Regular',
  displayFallback: 'System',
} as const;

export const typography = {
  size: {
    '2xs': 11,
    xs: 12,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 25,
    '2xl': 31,
    '3xl': 39,
    '4xl': 49,
    '5xl': 61,
  },
  leading: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.7,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Tracking authored in em; multiply by font size to get RN letterSpacing px.
  tracking: {
    tight: -0.02,
    normal: 0,
    wide: 0.04,
    widest: 0.12,
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 10,
  xl: 14,
  full: 999,
} as const;

export const borderWidth = {
  thin: 1,
  thick: 1.5,
} as const;

export const motion = {
  durationFast: 120,
  durationNormal: 180,
  durationSlow: 280,
} as const;

export const theme = {
  colors,
  fonts,
  typography,
  spacing,
  radius,
  borderWidth,
  motion,
} as const;

export type Theme = typeof theme;
