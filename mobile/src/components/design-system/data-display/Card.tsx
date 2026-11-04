import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/** Card surface; with `onPress` it becomes pressable and shows hover emphasis on press. */
export interface CardProps {
  children?: React.ReactNode;
  padding?: number;
  hoverable?: boolean;
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
