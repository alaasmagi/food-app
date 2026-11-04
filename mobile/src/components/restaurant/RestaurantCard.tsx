import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/design-system/data-display/Badge';
import { Card } from '@/components/design-system/data-display/Card';
import { Tag } from '@/components/design-system/data-display/Tag';
import { Button } from '@/components/design-system/forms/Button';
import { Icon } from '@/components/design-system/icons/Icon';
import { FavouriteEditorDialog } from '@/components/favourite/FavouriteEditorDialog';
import { RatingStars } from '@/components/favourite/RatingStars';
import { OfferList } from '@/components/restaurant/OfferList';
import { useRestaurantOffers } from '@/hooks/useRestaurantOffers';
import {
  useAddRestaurantToEnvironment,
  useRemoveRestaurantFromEnvironment,
} from '@/hooks/useEnvironmentMutations';
import type { MembershipEntry } from '@/hooks/useEnvironmentRestaurants';
import type { Favourite } from '@/types/favourite';
import type { Restaurant } from '@/types/restaurant';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  expanded: boolean;
  onToggle: () => void;
  selectedEnvironmentId?: string | null;
  membershipEntry?: MembershipEntry;
  favourite?: Favourite;
}

/** Restaurant card: name, city, badges, expandable offers, favourite rating and environment membership action. */
export function RestaurantCard({
  restaurant,
  expanded,
  onToggle,
  selectedEnvironmentId = null,
  membershipEntry,
  favourite,
}: RestaurantCardProps): React.ReactElement {
  // Enabled only when expanded; shares the cache entry with OfferList.
  const { data: offers } = useRestaurantOffers(restaurant.id, expanded);
  const resolvedEmpty = offers != null && offers.length === 0;
  const noOffersToday = !restaurant.hasOffers || resolvedEmpty;

  const [editorOpen, setEditorOpen] = useState(false);

  const addMembership = useAddRestaurantToEnvironment();
  const removeMembership = useRemoveRestaurantFromEnvironment();
  const isMember = membershipEntry != null;
  const membershipPending = addMembership.isPending || removeMembership.isPending;

  function toggleMembership() {
    if (selectedEnvironmentId == null) return;
    if (membershipEntry) {
      removeMembership.mutate({
        joinId: membershipEntry.joinId,
        concurrencyToken: membershipEntry.concurrencyToken,
      });
    } else {
      addMembership.mutate({ environmentId: selectedEnvironmentId, restaurantId: restaurant.id });
    }
  }

  return (
    <Card padding={spacing[4]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={restaurant.name}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.meta}>
            <Tag>{restaurant.city}</Tag>
            {restaurant.isFastFood && <Badge tone="neutral">Fast food</Badge>}
            {noOffersToday && <Badge tone="warning">No offers today</Badge>}
          </View>
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      <View style={styles.favouriteRow}>
        {favourite && <RatingStars value={favourite.rating} size={16} />}
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setEditorOpen(true)}
          accessibilityLabel={favourite ? 'Edit rating' : 'Rate'}
        >
          {favourite ? 'Edit rating' : 'Rate'}
        </Button>
      </View>

      {selectedEnvironmentId != null && (
        <View style={styles.actionRow}>
          <Button
            variant={isMember ? 'secondary' : 'ghost'}
            size="sm"
            icon={isMember ? 'minus' : 'plus'}
            onPress={toggleMembership}
            loading={membershipPending}
            accessibilityLabel={isMember ? 'Remove from environment' : 'Add to environment'}
          >
            {isMember ? 'Remove from environment' : 'Add to environment'}
          </Button>
        </View>
      )}

      {expanded && <OfferList restaurantId={restaurant.id} />}

      {editorOpen && (
        <FavouriteEditorDialog
          open
          onClose={() => setEditorOpen(false)}
          restaurantId={restaurant.id}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headerText: {
    flex: 1,
    gap: spacing[2],
  },
  name: {
    fontFamily: fonts.display,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
  },
  favouriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing[3],
  },
});
