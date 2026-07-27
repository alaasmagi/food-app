import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import type { MapPressEvent, MarkerDragStartEndEvent, Region } from 'react-native-maps';

import { Button } from '@/components/design-system/forms/Button';
import { Input } from '@/components/design-system/forms/Input';
import { darkMapStyle, regionForCoordinates } from '@/components/restaurant/mapStyle';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

/** The saved auto-fill origin the picker edits: a point plus an optional radius. */
export interface LocationOrigin {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
}

export interface EnvironmentLocationPickerProps {
  value: LocationOrigin;
  onChange: (next: LocationOrigin) => void;
}

/** The backend's effective radius when none is stored, in meters. */
export const DEFAULT_RADIUS_METERS = 500;

/** True when both coordinates are present (a location has been placed). */
export function hasLocation(value: LocationOrigin): boolean {
  return value.latitude != null && value.longitude != null;
}

/**
 * Client-side mirror of the backend's auto-fill write rules. Returns an inline
 * message when the origin is invalid, or null when it is safe to send:
 * coordinates are both-or-neither, a radius is allowed only with a location, and
 * a supplied radius is a whole number within the inclusive range 1..50000. The
 * backend remains the source of truth; this only avoids a predictable 400.
 */
export function validateOrigin(value: LocationOrigin): string | null {
  const hasLat = value.latitude != null;
  const hasLon = value.longitude != null;
  if (hasLat !== hasLon) {
    return 'Set both coordinates or clear the location.';
  }
  if (value.radiusMeters != null) {
    if (!hasLat) {
      return 'Set a location before entering a radius.';
    }
    if (
      !Number.isInteger(value.radiusMeters) ||
      value.radiusMeters < 1 ||
      value.radiusMeters > 50000
    ) {
      return 'Radius must be a whole number between 1 and 50000 meters.';
    }
  }
  return null;
}

/**
 * Optional map-based location + radius picker for an environment's auto-fill
 * origin. Reuses the restaurant map's dark styling. Tapping the map or dragging
 * the marker sets the coordinates; a radius input and a circle overlay appear
 * once a location is set (previewing 500 m when the radius is empty); an
 * optional Nominatim search recentres the map. The whole section is optional,
 * and "clear location" nulls all three fields. Fully controlled — the parent
 * owns the value and the client-side validation on save.
 */
export function EnvironmentLocationPicker({
  value,
  onChange,
}: EnvironmentLocationPickerProps): React.ReactElement {
  const mapRef = useRef<MapView | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const located = hasLocation(value);
  const initialRegion: Region = located
    ? regionForCoordinates([{ latitude: value.latitude as number, longitude: value.longitude as number }])
    : regionForCoordinates([]);

  function setPoint(latitude: number, longitude: number) {
    onChange({ ...value, latitude, longitude });
  }

  function handleMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoint(latitude, longitude);
  }

  function handleMarkerDragEnd(e: MarkerDragStartEndEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoint(latitude, longitude);
  }

  function handleClear() {
    onChange({ latitude: null, longitude: null, radiusMeters: null });
    setSearchMessage(null);
  }

  function handleRadiusChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '');
    onChange({ ...value, radiusMeters: digits === '' ? null : Number(digits) });
  }

  async function handleSearch() {
    const q = query.trim();
    if (q.length === 0 || searching) return;
    setSearching(true);
    setSearchMessage(null);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const results = (await res.json()) as { lat: string; lon: string }[];
      const first = results?.[0];
      if (!first) {
        setSearchMessage('No results for that search.');
        return;
      }
      const latitude = Number(first.lat);
      const longitude = Number(first.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setSearchMessage('No results for that search.');
        return;
      }
      setPoint(latitude, longitude);
      mapRef.current?.animateToRegion(
        regionForCoordinates([{ latitude, longitude }]),
        300,
      );
    } catch {
      setSearchMessage('Search is unavailable right now.');
    } finally {
      setSearching(false);
    }
  }

  const radiusText = value.radiusMeters == null ? '' : String(value.radiusMeters);
  const previewRadius = value.radiusMeters ?? DEFAULT_RADIUS_METERS;

  return (
    <View style={styles.section}>
      <Text style={styles.hint}>
        Optional. Pick a location and radius to fill this environment with nearby restaurants. Both
        are optional, and auto-fill is unavailable without a location.
      </Text>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Input
            placeholder="Search for a place"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            size="sm"
          />
        </View>
        <Button variant="secondary" size="sm" onPress={handleSearch} loading={searching}>
          Search
        </Button>
      </View>
      {searchMessage && <Text style={styles.searchMessage}>{searchMessage}</Text>}

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          userInterfaceStyle="dark"
          customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        >
          {located && (
            <>
              <Marker
                identifier="auto-fill-origin"
                draggable
                onDragEnd={handleMarkerDragEnd}
                coordinate={{
                  latitude: value.latitude as number,
                  longitude: value.longitude as number,
                }}
              />
              <Circle
                center={{
                  latitude: value.latitude as number,
                  longitude: value.longitude as number,
                }}
                radius={previewRadius}
                strokeColor={colors.accent5}
                fillColor="rgba(0,0,0,0.12)"
              />
            </>
          )}
        </MapView>
      </View>

      {located ? (
        <>
          <Input
            label="Radius (meters)"
            placeholder="500"
            value={radiusText}
            onChangeText={handleRadiusChange}
            hint={value.radiusMeters == null ? 'Defaults to 500 m' : undefined}
            size="sm"
          />
          <Button variant="ghost" size="sm" icon="bin" onPress={handleClear}>
            Clear location
          </Button>
        </>
      ) : (
        <Text style={styles.emptyHint}>Tap the map to set a location.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[2],
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: typography.size.xs * typography.leading.normal,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
  },
  searchMessage: {
    fontFamily: fonts.body,
    fontSize: typography.size['2xs'],
    color: colors.textSecondary,
  },
  mapWrap: {
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceApp,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
});
