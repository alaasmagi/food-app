import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import { Icon, IconName } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, typography } from '@/theme/tokens';

/**
 * Ported from the design system Input. Prop names follow Input.d.ts; the web
 * `onChange(event)` becomes React Native's idiomatic `onChangeText(text)` (the
 * same substitution Button made for `onClick` -> `onPress`). Web `<input>` /
 * `<textarea>` become a single `TextInput` with `multiline`. Focus shows an
 * accent border; `error` overrides `hint` and tints the border/text danger.
 */
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  /** Web input type. Only 'password'/'email' change native behavior. */
  type?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  multiline?: boolean;
  rows?: number;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

function keyboardTypeFor(type: string): KeyboardTypeOptions | undefined {
  return type === 'email' ? 'email-address' : undefined;
}

export function Input({
  label,
  placeholder,
  value,
  defaultValue,
  onChangeText,
  type = 'text',
  icon,
  error,
  hint,
  disabled = false,
  size = 'md',
  multiline = false,
  rows = 3,
  onSubmitEditing,
  autoFocus = false,
  style,
}: InputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const padY = size === 'sm' ? 6 : 9;
  const fontSize = size === 'sm' ? typography.size.xs : typography.size.sm;

  const borderColor = error
    ? colors.statusDanger
    : focused
      ? colors.borderFocus
      : colors.borderSubtle;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.fieldWrap, multiline && styles.fieldWrapMultiline]}>
        {icon && !multiline && (
          <View style={styles.icon} pointerEvents="none">
            <Icon name={icon} size={14} color={colors.textSecondary} />
          </View>
        )}
        <TextInput
          value={value}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          editable={!disabled}
          secureTextEntry={type === 'password'}
          keyboardType={keyboardTypeFor(type)}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          multiline={multiline}
          numberOfLines={multiline ? rows : undefined}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              fontSize,
              paddingVertical: padY,
              paddingLeft: icon && !multiline ? 32 : 10,
              borderColor,
              color: disabled ? colors.textDisabled : colors.textPrimary,
              backgroundColor: disabled ? colors.neutral1 : colors.surfaceCard,
              minHeight: multiline ? rows * 20 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
      </View>
      {(error || hint) && (
        <Text style={[styles.helper, error ? styles.helperError : null]}>{error || hint}</Text>
      )}
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
  fieldWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldWrapMultiline: {
    alignItems: 'flex-start',
  },
  icon: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingRight: 10,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: typography.size['2xs'],
    color: colors.textSecondary,
  },
  helperError: {
    color: colors.statusDanger,
  },
});
