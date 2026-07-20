import React, { useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing, typography } from '@/theme/tokens';

/** Ported 1:1 from Tabs.d.ts. */
export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  /** Uncontrolled initial selection. */
  defaultValue?: string;
  /** Controlled selection; when set, `onChange` drives selection. */
  value?: string;
  onChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Underline tabs with an accent indicator on the active tab. Ported from the
 * web Tabs: `<button>`/`onClick` become `Pressable`/`onPress`, the flex row
 * becomes a horizontal `ScrollView` so a long environment list can scroll, and
 * the CSS bottom border becomes a token-colored `borderBottomWidth`.
 */
export function Tabs({
  tabs,
  defaultValue,
  value,
  onChange,
  style,
}: TabsProps): React.ReactElement {
  const [internal, setInternal] = useState<string | undefined>(
    defaultValue ?? tabs[0]?.value,
  );
  const current = value !== undefined ? value : internal;

  function select(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((t) => {
          const active = t.value === current;
          return (
            <Pressable
              key={t.value}
              onPress={() => select(t.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t.label}
              style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
            >
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: spacing[1],
    borderBottomWidth: 2,
    // Pull the 2px indicator down over the container's 1px border.
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: colors.accent7,
  },
  tabInactive: {
    borderBottomColor: 'transparent',
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.sm,
  },
  labelActive: {
    fontFamily: fonts.bodySemibold,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  labelInactive: {
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
});
