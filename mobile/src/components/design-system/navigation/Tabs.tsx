import React, { useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** Underline tabs with an accent indicator, in a horizontal ScrollView so long lists scroll. */
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
