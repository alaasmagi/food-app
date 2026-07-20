import React, { useState } from 'react';
import { Modal, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icon } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

/** Ported 1:1 from Select.d.ts. */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Custom dropdown select with a checkmark on the current option. Ported from the
 * web Select: the `<button>` trigger becomes a `Pressable`, and the absolutely-
 * positioned dropdown becomes a `Modal` overlay (React Native has no page-level
 * absolute layer that escapes parent clipping) with a backdrop that dismisses on
 * outside press. Controlled when `value` is passed, else internal.
 */
export function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  style,
}: SelectProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const current = value !== undefined ? value : internal;
  const selected = options.find((o) => o.value === current);

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  return (
    <View style={[styles.container, style]}>
      {label != null && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityLabel={label}
        style={[
          styles.trigger,
          {
            borderColor: open ? colors.borderFocus : colors.borderSubtle,
            backgroundColor: disabled ? colors.neutral1 : colors.surfaceCard,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: disabled
                ? colors.textDisabled
                : selected
                  ? colors.textPrimary
                  : colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={14} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            {options.map((o) => {
              const isCurrent = o.value === current;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => choose(o.value)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isCurrent }}
                  style={({ pressed }) => [
                    styles.option,
                    (isCurrent || pressed) && styles.optionActive,
                  ]}
                >
                  <Text style={styles.optionLabel}>{o.label}</Text>
                  {isCurrent && <Icon name="check" size={13} color={colors.accent7} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  triggerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.surfaceOverlay,
  },
  menu: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing[1],
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  optionActive: {
    backgroundColor: colors.surfaceHover,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
});
