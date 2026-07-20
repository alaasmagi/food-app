import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/** Ported 1:1 from Checkbox.d.ts. `onClick` becomes `onPress`. */
export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Checkbox with an accent-filled checked state. Ported from the web Checkbox:
 * the box `<span>` becomes a `View` rendering the ported `Icon` check when on,
 * `onClick` becomes `onPress`, and values come from tokens. Controlled when
 * `checked` is passed, else internal.
 */
export function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
}: CheckboxProps): React.ReactElement {
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
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={label}
      style={[styles.row, style]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: isChecked ? colors.accent7 : colors.borderStrong,
            backgroundColor: isChecked ? colors.accent7 : colors.surfaceCard,
          },
        ]}
      >
        {isChecked && <Icon name="check" size={11} strokeWidth={2.5} color={colors.textOnAccent} />}
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
    gap: 8,
  },
  box: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  label: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
});
