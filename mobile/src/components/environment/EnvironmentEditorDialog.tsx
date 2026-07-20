import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/design-system/feedback/Dialog';
import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import {
  useCreateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { DiningEnvironment } from '@/types/environment';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface EnvironmentEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog renames/deletes this environment; otherwise it creates one. */
  environment?: DiningEnvironment | null;
}

/**
 * Create, rename, or delete an environment. Deleting is gated by an explicit
 * confirmation step rendered inside this same Dialog (a two-step internal
 * state), never a native Alert. Update and delete send the environment's
 * concurrency token as If-Match via the mutation hooks.
 */
export function EnvironmentEditorDialog({
  open,
  onClose,
  environment = null,
}: EnvironmentEditorDialogProps): React.ReactElement {
  const isEdit = environment != null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const create = useCreateEnvironment();
  const update = useUpdateEnvironment();
  const remove = useDeleteEnvironment();

  // Seed the fields from the environment each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(environment?.name ?? '');
      setDescription(environment?.description ?? '');
      setConfirmingDelete(false);
    }
  }, [open, environment]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && !create.isPending && !update.isPending;
  const pending = create.isPending || update.isPending || remove.isPending;

  function handleSave() {
    if (!canSave) return;
    const input = { name: trimmedName, description: description.trim() || null };
    if (isEdit && environment) {
      update.mutate(
        { id: environment.id, input, concurrencyToken: environment.concurrencyToken },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(input, { onSuccess: onClose });
    }
  }

  function handleConfirmDelete() {
    if (!environment) return;
    remove.mutate(
      { id: environment.id, concurrencyToken: environment.concurrencyToken },
      { onSuccess: onClose },
    );
  }

  const title = confirmingDelete
    ? 'Delete environment'
    : isEdit
      ? 'Edit environment'
      : 'New environment';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        confirmingDelete ? (
          <>
            <Button variant="ghost" onPress={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onPress={handleConfirmDelete} loading={remove.isPending}>
              Delete
            </Button>
          </>
        ) : (
          <>
            {isEdit && (
              <Button
                variant="danger"
                icon="bin"
                onPress={() => setConfirmingDelete(true)}
                accessibilityLabel="Delete environment"
              >
                Delete
              </Button>
            )}
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} disabled={!canSave} loading={pending}>
              Save
            </Button>
          </>
        )
      }
    >
      {confirmingDelete ? (
        <Text style={styles.confirmText}>
          This removes the environment and its restaurant memberships. This cannot be undone.
        </Text>
      ) : (
        <View style={styles.fields}>
          <Input
            label="Name"
            placeholder="e.g. Lunch spots"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Input
            label="Description"
            placeholder="Optional"
            value={description}
            onChangeText={setDescription}
            hint="Optional"
            multiline
            rows={3}
          />
        </View>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing[3],
  },
  confirmText: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.size.sm * typography.leading.normal,
  },
});
