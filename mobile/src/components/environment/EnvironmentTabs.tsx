import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tabs, type TabItem } from '@/components/design-system/navigation/Tabs';
import { Icon } from '@/components/design-system/icons/Icon';
import { EnvironmentEditorDialog } from '@/components/environment/EnvironmentEditorDialog';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useEnvironmentStore } from '@/stores/environmentStore';
import type { DiningEnvironment } from '@/types/environment';
import { colors, spacing } from '@/theme/tokens';

/** Sentinel tab value for the fixed "All" tab (store selection is `null`). */
const ALL_VALUE = '__all__';

/**
 * Environment tab row: a fixed "All" tab followed by one tab per environment.
 * Selecting a tab sets the shared selected-environment store, which drives
 * client-side filtering on both the Dashboard and the Map. A trailing "+"
 * opens the editor to create an environment; an edit affordance opens it to
 * rename or delete the currently selected environment.
 */
export function EnvironmentTabs(): React.ReactElement {
  const { data: environments } = useEnvironments();
  const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId);
  const setSelectedEnvironmentId = useEnvironmentStore((s) => s.setSelectedEnvironmentId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);

  const envs: DiningEnvironment[] = environments ?? [];
  const tabItems: TabItem[] = [
    { value: ALL_VALUE, label: 'All' },
    ...envs.map((e) => ({ value: e.id, label: e.name })),
  ];
  const currentValue = selectedEnvironmentId ?? ALL_VALUE;
  const selectedEnvironment = envs.find((e) => e.id === selectedEnvironmentId) ?? null;

  function handleChange(value: string) {
    setSelectedEnvironmentId(value === ALL_VALUE ? null : value);
  }

  function openCreate() {
    setEditingExisting(false);
    setDialogOpen(true);
  }

  function openEdit() {
    setEditingExisting(true);
    setDialogOpen(true);
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Tabs
          tabs={tabItems}
          value={currentValue}
          onChange={handleChange}
          style={styles.tabs}
        />
        {selectedEnvironment && (
          <Pressable
            onPress={openEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit environment"
            hitSlop={8}
            style={styles.action}
          >
            <Icon name="account-settings" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="New environment"
          hitSlop={8}
          style={styles.action}
        >
          <Icon name="plus" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <EnvironmentEditorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        environment={editingExisting ? selectedEnvironment : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tabs: {
    flex: 1,
    // The row draws the shared bottom border; let the tabs sit flush over it.
    borderBottomWidth: 0,
  },
  action: {
    paddingHorizontal: spacing[2],
    paddingBottom: 10,
  },
});
