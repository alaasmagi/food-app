import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon, IconName } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/** Ported 1:1 from the design system Badge — an uppercase mono status label. */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children?: React.ReactNode;
  /** Semantic tone. Default "neutral". */
  tone?: BadgeTone;
  /** Optional leading icon glyph, colored to the tone foreground. */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.neutral3, fg: colors.textPrimary },
  accent: { bg: colors.accent2, fg: colors.accent9 },
  success: { bg: colors.statusSuccessBg, fg: colors.statusSuccess },
  warning: { bg: colors.statusWarningBg, fg: colors.statusWarning },
  danger: { bg: colors.statusDangerBg, fg: colors.statusDanger },
};

export function Badge({
  children,
  tone = 'neutral',
  icon,
  style,
}: BadgeProps): React.ReactElement {
  const t = TONE[tone] ?? TONE.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon && <Icon name={icon} size={10} color={t.fg} />}
      {children != null && <Text style={[styles.label, { color: t.fg }]}>{children}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: typography.size['2xs'],
    fontWeight: typography.weight.medium,
    // tracking-wide (0.04em) * 11px font size.
    letterSpacing: 0.44,
    textTransform: 'uppercase',
  },
});
