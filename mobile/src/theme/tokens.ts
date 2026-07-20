/**
 * Design tokens ported once from alaasmagi-design-system/tokens/*.css.
 *
 * The design system authors colors in OKLCH, which React Native cannot parse,
 * so every color below is the hex/rgba equivalent of its OKLCH source (dark
 * `:root` values only — this app is dark-mode-first and dark-only). Each
 * `--token-name` becomes a camelCase key with the same literal value. Nothing
 * in the app imports the design system's CSS; components read from here.
 */

/** Raw neutral ramp (app background -> bright text). */
const neutral = {
  neutral0: '#0C1014', // app background
  neutral1: '#12161B', // raised surface
  neutral2: '#1B2025', // card surface
  neutral3: '#272C32', // hover surface
  neutral4: '#2E343A', // border, subtle
  neutral5: '#424850', // border, strong
  neutral6: '#636A71', // disabled text
  neutral7: '#8D9399', // secondary text
  neutral8: '#B9BEC4', // primary text (soft)
  neutral9: '#EBEFF2', // primary text (bright)
} as const;

/** Raw accent scale (single cyan-blue hue). */
const accent = {
  accent9: '#1AC8FF', // bright
  accent7: '#00A8E6', // default
  accent6: '#008FCD', // hover
  accent5: '#0076B1', // press
  accent3: '#003451', // subtle fill
  accent2: '#002436', // faint fill
} as const;

/** Raw status scales (`-7` foreground, `-3` background). */
const status = {
  success7: '#48B162',
  success3: '#083214',
  warning7: '#E09C1A',
  warning3: '#412800',
  danger7: '#EC5B57',
  danger3: '#4F1313',
} as const;

/**
 * Semantic aliases — the layer components actually consume. Mirrors the
 * design system's `--surface-*`, `--border-*`, `--text-*`, `--action-*`,
 * and `--status-*` aliases with the dark values resolved.
 */
export const colors = {
  ...neutral,
  ...accent,
  ...status,

  // surfaces
  surfaceApp: neutral.neutral0,
  surfaceRaised: neutral.neutral1,
  surfaceCard: neutral.neutral2,
  surfaceHover: neutral.neutral3,
  surfaceOverlay: 'rgba(12, 16, 20, 0.72)',

  // borders
  borderSubtle: neutral.neutral4,
  borderStrong: neutral.neutral5,
  borderFocus: accent.accent7,

  // text
  textPrimary: neutral.neutral9,
  textSecondary: neutral.neutral7,
  textDisabled: neutral.neutral6,
  textOnAccent: '#020B10',
  textLink: accent.accent9,
  textLinkHover: '#63DEFF',

  // actions
  actionPrimary: accent.accent7,
  actionPrimaryHover: accent.accent6,
  actionPrimaryPress: accent.accent5,
  actionPrimaryText: '#020B10',

  // status semantic
  statusSuccess: status.success7,
  statusSuccessBg: status.success3,
  statusWarning: status.warning7,
  statusWarningBg: status.warning3,
  statusDanger: status.danger7,
  statusDangerBg: status.danger3,
} as const;

/** Font families (Figtree for display/body, JetBrains Mono for mono). */
export const fonts = {
  display: 'Figtree_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemibold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  mono: 'JetBrainsMono_400Regular',
  // Fallback family names for platforms/tests where webfonts are not loaded.
  displayFallback: 'System',
} as const;

/** Type scale (1.25 ratio, base 16), line heights, weights, tracking. */
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

/** 4px-base spacing grid (note deliberate gaps: no 7, 9, 11, ...). */
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
