import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/**
 * Ported 1:1 from the design system Tag — a full-pill chip for user-facing
 * categorization. `selected` gives the accent-tinted filter look; `onRemove`
 * adds a trailing pressable x.
 */
export interface TagProps {
  children?: React.ReactNode;
  /** Accent-tinted "selected" look, e.g. an active filter. Default false. */
  selected?: boolean;
  /** When set, renders a trailing x that calls this. */
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Tag({
  children,
  selected = false,
  onRemove,
  style,
}: TagProps): React.ReactElement {
  const fg = selected ? colors.accent9 : colors.textPrimary;
  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: selected ? colors.accent2 : colors.surfaceHover,
          borderColor: selected ? colors.accent3 : colors.borderSubtle,
        },
        style,
      ]}
    >
      {children != null && <Text style={[styles.label, { color: fg }]}>{children}</Text>}
      {onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel="Remove"
          hitSlop={6}
          style={styles.remove}
        >
          <Icon name="x" size={11} color={fg} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  remove: {
    opacity: 0.7,
  },
});
