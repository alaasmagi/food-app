import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { Icon, IconName } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/** Props ported 1:1 from Button.d.ts; web `onClick`/`type` become `onPress`. */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. Default "primary". */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Default "md". */
  size?: 'sm' | 'md' | 'lg';
  /** Optional leading/trailing icon glyph. */
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  /** Shows spinner in place of icon, disables interaction. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

type SizeSpec = {
  padY: number;
  padX: number;
  fontSize: number;
  gap: number;
  iconSize: number;
  radius: number;
};

const SIZE: Record<NonNullable<ButtonProps['size']>, SizeSpec> = {
  sm: { padY: 6, padX: 10, fontSize: typography.size.xs, gap: 6, iconSize: 14, radius: radius.sm },
  md: { padY: 9, padX: 14, fontSize: typography.size.sm, gap: 7, iconSize: 15, radius: radius.md },
  lg: { padY: 12, padX: 18, fontSize: typography.size.base, gap: 8, iconSize: 16, radius: radius.md },
};

type VariantSpec = { base: string; press: string; text: string; border: string };

function variantStyle(variant: NonNullable<ButtonProps['variant']>): VariantSpec {
  switch (variant) {
    case 'secondary':
      return {
        base: colors.surfaceCard,
        press: colors.neutral4,
        text: colors.textPrimary,
        border: colors.borderSubtle,
      };
    case 'ghost':
      return {
        base: 'transparent',
        press: colors.neutral4,
        text: colors.textPrimary,
        border: 'transparent',
      };
    case 'danger':
      return {
        base: colors.statusDangerBg,
        press: colors.statusDangerBg,
        text: colors.statusDanger,
        border: colors.statusDangerBg,
      };
    default:
      return {
        base: colors.actionPrimary,
        press: colors.actionPrimaryPress,
        text: colors.actionPrimaryText,
        border: 'transparent',
      };
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  accessibilityLabel,
}: ButtonProps): React.ReactElement {
  const s = SIZE[size] ?? SIZE.md;
  const v = variantStyle(variant);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: fullWidth ? '100%' : undefined,
          gap: s.gap,
          paddingVertical: s.padY,
          paddingHorizontal: s.padX,
          borderRadius: s.radius,
          borderColor: isDisabled ? colors.borderSubtle : v.border,
          backgroundColor: isDisabled
            ? colors.neutral2
            : pressed
              ? v.press
              : v.base,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDisabled ? colors.textDisabled : v.text} />
      ) : (
        icon &&
        iconPosition === 'left' && (
          <Icon name={icon} size={s.iconSize} color={isDisabled ? colors.textDisabled : v.text} />
        )
      )}
      {children != null && (
        <Text
          style={[
            styles.label,
            { fontSize: s.fontSize, color: isDisabled ? colors.textDisabled : v.text },
          ]}
        >
          {children}
        </Text>
      )}
      {!loading && icon && iconPosition === 'right' && (
        <Icon name={icon} size={s.iconSize} color={isDisabled ? colors.textDisabled : v.text} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  } as ViewStyle,
  label: {
    fontFamily: fonts.bodyMedium,
    fontWeight: typography.weight.medium,
    letterSpacing: 0,
  },
});
