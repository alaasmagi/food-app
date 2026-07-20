import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import type { Restaurant } from '@/types/restaurant';
import { colors, fonts, spacing, typography } from '@/theme/tokens';
import { darkMapStyle, regionForCoordinates } from '@/components/restaurant/mapStyle';

export interface RestaurantMapProps {
  restaurants: Restaurant[];
  /** Called with a restaurant id when its callout "See offers" is activated. */
  onSeeOffers: (restaurantId: string) => void;
}

/** A restaurant has a usable location if both coords are finite and not (0,0). */
function hasCoordinates(r: Restaurant): boolean {
  return (
    Number.isFinite(r.latitude) &&
    Number.isFinite(r.longitude) &&
    !(r.latitude === 0 && r.longitude === 0)
  );
}

export function RestaurantMap({
  restaurants,
  onSeeOffers,
}: RestaurantMapProps): React.ReactElement {
  const located = useMemo(() => restaurants.filter(hasCoordinates), [restaurants]);
  const initialRegion = useMemo(
    () => regionForCoordinates(located.map((r) => ({ latitude: r.latitude, longitude: r.longitude }))),
    [located],
  );

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        userInterfaceStyle="dark"
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
      >
        {located.map((r) => (
          <Marker
            key={r.id}
            identifier={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          >
            <Callout onPress={() => onSeeOffers(r.id)} tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{r.name}</Text>
                <Text style={styles.calloutAction}>See offers</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceApp,
  },
  // Callouts render in a native light bubble on both platforms; keep text dark
  // for legibility inside that bubble rather than using dark-on-dark tokens.
  callout: {
    minWidth: 140,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[1],
    gap: spacing[1],
  },
  calloutName: {
    fontFamily: fonts.bodySemibold,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#111111',
  },
  calloutAction: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.accent5,
  },
});
