import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/**
 * Ported 1:1 from the design system Card. A surface one step brighter than the
 * app background, thin border, no shadow (depth comes from surface steps).
 * Web hover has no RN analog; when `onPress` is given the card becomes
 * pressable and shows the design system's hover emphasis on press instead.
 */
export interface CardProps {
  children?: React.ReactNode;
  /** Inner padding. Default 20 (matches the web literal). */
  padding?: number;
  /** Emphasize on interaction — for clickable cards. */
  hoverable?: boolean;
  /** Optional press handler; makes the whole card pressable. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  padding = 20,
  onPress,
  style,
}: CardProps): React.ReactElement {
  const base = [styles.card, { padding }, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...base,
          pressed
            ? { backgroundColor: colors.surfaceHover, borderColor: colors.borderStrong }
            : null,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
  },
});
