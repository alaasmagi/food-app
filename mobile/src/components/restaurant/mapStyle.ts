import type { MapStyleElement, Region } from 'react-native-maps';

/**
 * Dark map style for Google Maps (Android). iOS uses Apple Maps' native dark
 * mode via `userInterfaceStyle`, so this array is only applied on Android. The
 * palette approximates the design system's dark surfaces (near-black base,
 * muted labels) so the map reads as part of the dark app.
 */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#0C1014' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0C1014' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8D9399' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#424850' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#636A71' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#12161B' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#272C32' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8D9399' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2E343A' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#636A71' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#02060A' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#424850' }],
  },
];

/** Fallback region when there are no coordinate-bearing restaurants. */
export const DEFAULT_REGION: Region = {
  latitude: 59.437,
  longitude: 24.7536,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};

/**
 * Fits a region to a set of coordinates (bounding box + padding). Returns
 * DEFAULT_REGION when the list is empty.
 */
export function regionForCoordinates(
  coords: { latitude: number; longitude: number }[],
): Region {
  if (coords.length === 0) return DEFAULT_REGION;

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLon = coords[0].longitude;
  let maxLon = coords[0].longitude;

  for (const c of coords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLon = Math.min(minLon, c.longitude);
    maxLon = Math.max(maxLon, c.longitude);
  }

  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.02);
  const longitudeDelta = Math.max((maxLon - minLon) * 1.4, 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
