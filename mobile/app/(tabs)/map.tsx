import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/design-system/icons/Icon';
import { EnvironmentTabs } from '@/components/environment/EnvironmentTabs';
import { OfferList } from '@/components/restaurant/OfferList';
import { RestaurantMap } from '@/components/restaurant/RestaurantMap';
import { useEnvironmentFilteredRestaurants } from '@/hooks/useEnvironmentFilteredRestaurants';
import type { Restaurant } from '@/types/restaurant';
import { colors, fonts, spacing, typography } from '@/theme/tokens';

/**
 * Map tab: renders the shared restaurant catalog (same `useRestaurants()` cache
 * as the Dashboard) as map markers, filtered to the selected environment via
 * EnvironmentTabs. "See offers" on a marker opens that restaurant's offers in a
 * dismissible sheet, reusing OfferList.
 */
export default function MapScreen() {
  const { query, restaurants } = useEnvironmentFilteredRestaurants();
  const { isLoading, isError, error } = query;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => restaurants.find((r: Restaurant) => r.id === selectedId) ?? null,
    [restaurants, selectedId],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <EnvironmentTabs />
      </SafeAreaView>

      <View style={styles.mapWrap}>
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
          <RestaurantMap restaurants={restaurants} onSeeOffers={setSelectedId} />
        )}
      </View>

      <Modal
        visible={selected != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedId(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedId(null)}>
          {/* Stop backdrop press from closing when tapping inside the sheet. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selected?.name}</Text>
              <Pressable
                onPress={() => setSelectedId(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <Icon name="x" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            {selected && <OfferList restaurantId={selected.id} />}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceApp,
  },
  topBar: {
    backgroundColor: colors.surfaceApp,
    paddingHorizontal: spacing[6],
  },
  mapWrap: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    backgroundColor: colors.surfaceApp,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typography.size.base,
    color: colors.statusDanger,
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceOverlay,
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: spacing[4],
    borderTopRightRadius: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
    minHeight: 160,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
});
