import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnvironmentTabs } from '@/components/environment/EnvironmentTabs';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useEnvironmentFilteredRestaurants } from '@/hooks/useEnvironmentFilteredRestaurants';
import { useFavourites } from '@/hooks/useFavourites';
import type { Restaurant } from '@/types/restaurant';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Dashboard: the shared restaurant catalog with today's offers, filtered to the
 * selected environment via EnvironmentTabs. A refreshable, virtualized list of
 * cards, each expandable to lazily fetch its offers.
 */
export default function DashboardScreen() {
  const { query, restaurants, membership, selectedEnvironmentId } =
    useEnvironmentFilteredRestaurants();
  const { isLoading, isError, error, refetch, isRefetching } = query;
  const { favouriteMap } = useFavourites();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Restaurant }) => (
      <RestaurantCard
        restaurant={item}
        expanded={expanded.has(item.id)}
        onToggle={() => toggle(item.id)}
        selectedEnvironmentId={selectedEnvironmentId}
        membershipEntry={membership[item.id]}
        favourite={favouriteMap[item.id]}
      />
    ),
    [expanded, toggle, selectedEnvironmentId, membership, favouriteMap],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Today's offers</Text>
      <View style={styles.tabs}>
        <EnvironmentTabs />
      </View>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent7} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>
            {error instanceof Error ? error.message : "Couldn't load restaurants."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent7}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.empty}>
                {selectedEnvironmentId != null
                  ? 'No restaurants in this environment yet.'
                  : 'No restaurants yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surfaceApp,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontWeight: typography.weight.bold,
    fontSize: typography.size['2xl'],
    color: colors.textPrimary,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  tabs: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
  },
  list: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.statusDanger,
    textAlign: 'center',
  },
});
