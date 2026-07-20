import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/design-system/icons/Icon';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

/**
 * Ported from the design system Dialog. The web absolutely-positioned overlay
 * becomes a React Native `Modal` with a translucent backdrop `Pressable` that
 * closes on outside press; an inner `Pressable` swallows presses so taps inside
 * the card do not dismiss it (the native analog of `stopPropagation`). `width`
 * is a number of dp here rather than a CSS string.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** Right-aligned action row, e.g. a Cancel + confirm Button pair. */
  footer?: React.ReactNode;
  /** Card width in dp. Default 420. */
  width?: number;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  width = 420,
}: DialogProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { width }]} onPress={() => {}}>
          <View style={styles.header}>
            {title != null && <Text style={styles.title}>{title}</Text>}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <Icon name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.surfaceOverlay,
  },
  card: {
    maxWidth: '100%',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing[5],
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  body: {
    gap: spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[1],
  },
});
