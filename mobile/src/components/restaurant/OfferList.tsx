import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useRestaurantOffers } from '@/hooks/useRestaurantOffers';
import type { Offer } from '@/types/restaurant';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Owns the lazy offers query for one restaurant and renders its rows, plus
 * loading, "No offers today" empty, and error states. Rendered only when the
 * parent card is expanded, so its query is always enabled here.
 */
export function OfferList({ restaurantId }: { restaurantId: string }): React.ReactElement {
  const { data, isLoading, isError, error } = useRestaurantOffers(restaurantId, true);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent7} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {error instanceof Error ? error.message : "Couldn't load offers."}
        </Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.empty}>No offers today.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {data.map((offer: Offer, i: number) => (
        <View key={`${offer.offerText}-${i}`} style={styles.row}>
          <Text style={styles.text}>{offer.offerText}</Text>
          {offer.offerPrice != null && <Text style={styles.price}>{offer.offerPrice}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[2],
    paddingTop: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  text: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  price: {
    fontFamily: fonts.mono,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  centered: {
    paddingTop: spacing[3],
    alignItems: 'flex-start',
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typography.size.sm,
    color: colors.statusDanger,
  },
});
