import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/design-system/feedback/Dialog';
import { useToast } from '@/components/design-system/feedback/ToastProvider';
import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import {
  EnvironmentLocationPicker,
  validateOrigin,
  type LocationOrigin,
} from '@/components/environment/EnvironmentLocationPicker';
import {
  useAutoFillEnvironment,
  useCreateEnvironment,
  useDeleteEnvironment,
  useUpdateEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { EnvironmentInput } from '@/api/environments';
import type { DiningEnvironment } from '@/types/environment';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface EnvironmentEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog renames/deletes this environment; otherwise it creates one. */
  environment?: DiningEnvironment | null;
}

/** True when an environment has a stored auto-fill origin (both coordinates). */
function hasStoredCoordinates(e: DiningEnvironment | null): e is DiningEnvironment {
  return e != null && e.autoFillLatitude != null && e.autoFillLongitude != null;
}

/**
 * Create, rename, or delete an environment. Deleting is gated by an explicit
 * confirmation step rendered inside this same Dialog (a two-step internal
 * state), never a native Alert. Update and delete send the environment's
 * concurrency token as If-Match via the mutation hooks.
 *
 * An optional location section (a map-based point + radius picker) sets the
 * environment's auto-fill origin. Once an environment with coordinates is saved
 * — or when reopening one that already has an origin — a "fill with nearby
 * restaurants" action triggers the backend's proximity import and toasts the
 * number added.
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
  const [origin, setOrigin] = useState<LocationOrigin>({
    latitude: null,
    longitude: null,
    radiusMeters: null,
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  // The environment as last persisted this session, so the fill action can run
  // immediately after a located environment is created or renamed.
  const [savedEnvironment, setSavedEnvironment] = useState<DiningEnvironment | null>(null);

  const create = useCreateEnvironment();
  const update = useUpdateEnvironment();
  const remove = useDeleteEnvironment();
  const autoFill = useAutoFillEnvironment();
  const toast = useToast();

  // Seed the fields and the origin from the environment each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(environment?.name ?? '');
      setDescription(environment?.description ?? '');
      setConfirmingDelete(false);
      setOrigin({
        latitude: environment?.autoFillLatitude ?? null,
        longitude: environment?.autoFillLongitude ?? null,
        radiusMeters: environment?.autoFillRadiusMeters ?? null,
      });
      setLocationError(null);
      setSavedEnvironment(null);
    }
  }, [open, environment]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && !create.isPending && !update.isPending;
  const pending = create.isPending || update.isPending || remove.isPending;

  // The environment to run auto-fill against: whichever we last saved this
  // session if it has coordinates, otherwise the environment being edited.
  const fillTarget = hasStoredCoordinates(savedEnvironment)
    ? savedEnvironment
    : hasStoredCoordinates(environment)
      ? environment
      : null;

  function handleOriginChange(next: LocationOrigin) {
    setOrigin(next);
    if (locationError) setLocationError(null);
  }

  function handleSave() {
    if (!canSave) return;
    const originError = validateOrigin(origin);
    if (originError) {
      setLocationError(originError);
      return;
    }
    setLocationError(null);
    const input: EnvironmentInput = {
      name: trimmedName,
      description: description.trim() || null,
      autoFillLatitude: origin.latitude,
      autoFillLongitude: origin.longitude,
      autoFillRadiusMeters: origin.radiusMeters,
    };
    // Keep the dialog open when the saved environment has coordinates so the
    // fill action is reachable right away; otherwise close as before.
    const onSuccess = (saved: DiningEnvironment) => {
      if (hasStoredCoordinates(saved)) {
        setSavedEnvironment(saved);
      } else {
        onClose();
      }
    };
    if (isEdit && environment) {
      update.mutate(
        { id: environment.id, input, concurrencyToken: environment.concurrencyToken },
        { onSuccess },
      );
    } else {
      create.mutate(input, { onSuccess });
    }
  }

  function handleFill() {
    if (!fillTarget || autoFill.isPending) return;
    autoFill.mutate(fillTarget.id, {
      onSuccess: (result) => {
        toast.push(
          result.added > 0
            ? {
                title: `Added ${result.added} ${result.added === 1 ? 'restaurant' : 'restaurants'}`,
                tone: 'success',
              }
            : { title: 'No new restaurants added', tone: 'info' },
        );
      },
      onError: () => toast.push({ title: 'Could not fill from location', tone: 'danger' }),
    });
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
          <EnvironmentLocationPicker value={origin} onChange={handleOriginChange} />
          {locationError && <Text style={styles.errorText}>{locationError}</Text>}
          {fillTarget && (
            <Button
              variant="secondary"
              icon="plus"
              onPress={handleFill}
              loading={autoFill.isPending}
              disabled={autoFill.isPending}
            >
              Fill with nearby restaurants
            </Button>
          )}
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: typography.size.xs,
    color: colors.statusDanger,
  },
});
