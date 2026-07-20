import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/design-system/feedback/Dialog';
import { Button } from '@/components/design-system/forms/Button';
import { Checkbox } from '@/components/design-system/forms/Checkbox';
import { Input } from '@/components/design-system/forms/Input';
import { Switch } from '@/components/design-system/forms/Switch';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useCreateWheel, useUpdateWheel } from '@/hooks/useWheelMutations';
import { useShareWheelLink } from '@/hooks/useShareWheelLink';
import type { Restaurant } from '@/types/restaurant';
import type { UserWheel } from '@/types/wheel';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface WheelEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this wheel; otherwise it creates one. */
  wheel?: UserWheel | null;
}

/**
 * Create or edit a wheel: a name, a searchable checkbox list over the already
 * cached restaurant catalog (no extra fetch), and an isPublic switch. The saved
 * `restaurantNames` is a frozen snapshot of the checked restaurants' names (not
 * ids). Editing a saved, public wheel also offers a "Copy share link" action.
 */
export function WheelEditorDialog({
  open,
  onClose,
  wheel = null,
}: WheelEditorDialogProps): React.ReactElement {
  const isEdit = wheel != null;
  const { data: restaurants } = useRestaurants();
  const create = useCreateWheel();
  const update = useUpdateWheel();
  const { copyShareLink } = useShareWheelLink();

  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Seed the form from the edited wheel each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(wheel?.name ?? '');
      setIsPublic(wheel?.isPublic ?? false);
      setSelected(new Set(wheel?.restaurantNames ?? []));
      setSearch('');
    }
  }, [open, wheel]);

  const catalog: Restaurant[] = restaurants ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((r) => r.name.toLowerCase().includes(q));
  }, [catalog, search]);

  function toggleName(restaurantName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(restaurantName)) next.delete(restaurantName);
      else next.add(restaurantName);
      return next;
    });
  }

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && !create.isPending && !update.isPending;
  const pending = create.isPending || update.isPending;

  function handleSave() {
    if (!canSave) return;
    // Frozen snapshot of names, in catalog order, deduped.
    const restaurantNames = catalog.map((r) => r.name).filter((n) => selected.has(n));
    const input = { name: trimmedName, restaurantNames, isPublic };
    if (isEdit && wheel) {
      update.mutate(
        { id: wheel.id, input, concurrencyToken: wheel.concurrencyToken },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(input, { onSuccess: onClose });
    }
  }

  const showShare = isEdit && wheel != null && isPublic;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit wheel' : 'New wheel'}
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave} disabled={!canSave} loading={pending}>
            Save
          </Button>
        </>
      }
    >
      <Input label="Name" placeholder="e.g. Friday lunch" value={name} onChangeText={setName} />

      <View>
        <Text style={styles.label}>Restaurants</Text>
        <Input placeholder="Search restaurants" icon="search" value={search} onChangeText={setSearch} />
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.map((r) => (
            <Checkbox
              key={r.id}
              label={r.name}
              checked={selected.has(r.name)}
              onChange={() => toggleName(r.name)}
              style={styles.checkboxRow}
            />
          ))}
          {filtered.length === 0 && <Text style={styles.emptyList}>No restaurants match.</Text>}
        </ScrollView>
      </View>

      <View style={styles.publicRow}>
        <Switch label="Public" checked={isPublic} onChange={setIsPublic} />
        {showShare && (
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-right"
            iconPosition="right"
            onPress={() => copyShareLink(wheel.id)}
          >
            Copy share link
          </Button>
        )}
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  list: {
    maxHeight: 200,
    marginTop: spacing[2],
  },
  checkboxRow: {
    paddingVertical: spacing[2],
  },
  emptyList: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    paddingVertical: spacing[2],
  },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
});
