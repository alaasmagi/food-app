import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon, IconName } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/** Ported 1:1 from Toast.d.ts. `onClose` uses onPress mechanics in RN. */
export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  title: string;
  description?: string;
  tone?: ToastTone;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<ToastTone, { icon: IconName; color: string }> = {
  info: { icon: 'info', color: colors.accent9 },
  success: { icon: 'check-circle', color: colors.statusSuccess },
  warning: { icon: 'alert-triangle', color: colors.statusWarning },
  danger: { icon: 'alert-circle', color: colors.statusDanger },
};

/**
 * Notification card with an icon, title, optional description, and 4 tones.
 * Ported from the web Toast: `<div>`/`<span>` become `View`/`Text`, the close
 * `onClick` becomes a `Pressable` `onPress`, and CSS values come from tokens.
 * This is just the card; the ToastProvider positions and stacks it.
 */
export function Toast({
  title,
  description,
  tone = 'info',
  onClose,
  style,
}: ToastProps): React.ReactElement {
  const t = TONE[tone] ?? TONE.info;
  return (
    <View style={[styles.card, style]}>
      <View style={styles.icon}>
        <Icon name={t.icon} size={16} color={t.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description != null && <Text style={styles.description}>{description}</Text>}
      </View>
      {onClose && (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={8}
          style={styles.close}
        >
          <Icon name="x" size={13} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: 320,
    maxWidth: '100%',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodySemibold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  close: {
    marginTop: 1,
  },
});
