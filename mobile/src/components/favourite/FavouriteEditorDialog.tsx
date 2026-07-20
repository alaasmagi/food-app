import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/design-system/feedback/Dialog';
import { useToast } from '@/components/design-system/feedback/ToastProvider';
import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import { RatingStars } from '@/components/favourite/RatingStars';
import { useFavourites } from '@/hooks/useFavourites';
import { useUpsertFavourite } from '@/hooks/useUpsertFavourite';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface FavouriteEditorDialogProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
}

/** Mirrors the backend [Range(1,5)] validation before the API call. */
function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Rate a restaurant 1-5 with an optional note. Seeds its fields from the
 * restaurant's existing favourite on open, validates the rating client-side,
 * upserts via `useUpsertFavourite`, and confirms success or surfaces an error
 * via a toast. On error the dialog stays open for a retry.
 */
export function FavouriteEditorDialog({
  open,
  onClose,
  restaurantId,
}: FavouriteEditorDialogProps): React.ReactElement {
  const { favouriteFor } = useFavourites();
  const upsert = useUpsertFavourite();
  const { push } = useToast();

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  // Seed the form from the existing favourite each time the dialog opens.
  useEffect(() => {
    if (open) {
      const existing = favouriteFor(restaurantId);
      setRating(existing?.rating ?? 0);
      setNote(existing?.note ?? '');
    }
  }, [open, restaurantId, favouriteFor]);

  const valid = isValidRating(rating);

  function handleSave() {
    if (!valid || upsert.isPending) return;
    upsert.mutate(
      { restaurantId, rating, note: note.trim() || null },
      {
        onSuccess: () => {
          push({ title: 'Rating saved', tone: 'success' });
          onClose();
        },
        onError: () => {
          push({
            title: 'Could not save rating',
            description: 'Please try again.',
            tone: 'danger',
          });
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Rate restaurant"
      footer={
        <>
          <Button variant="ghost" onPress={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={!valid}
            loading={upsert.isPending}
          >
            Save
          </Button>
        </>
      }
    >
      <View style={styles.field}>
        <Text style={styles.label}>Rating</Text>
        <RatingStars value={rating} editable size={28} onChange={setRating} />
      </View>
      <Input
        label="Note"
        placeholder="Optional"
        value={note}
        onChangeText={setNote}
        multiline
        rows={3}
      />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
});
