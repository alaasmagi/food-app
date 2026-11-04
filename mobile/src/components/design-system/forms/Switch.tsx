import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, typography } from '@/theme/tokens';

export interface SwitchProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Toggle switch with an accent track when on; controlled when `checked` is passed. */
export function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
}: SwitchProps): React.ReactElement {
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const isChecked = checked !== undefined ? checked : internal;

  function toggle() {
    if (disabled) return;
    if (checked === undefined) setInternal((c) => !c);
    onChange?.(!isChecked);
  }

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={label}
      style={[styles.row, style]}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: disabled
              ? colors.neutral3
              : isChecked
                ? colors.accent7
                : colors.neutral4,
          },
        ]}
      >
        <View style={[styles.thumb, { left: isChecked ? 16 : 2 }]} />
      </View>
      {label != null && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    width: 34,
    height: 20,
    borderRadius: radius.full,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.neutral9,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
});
