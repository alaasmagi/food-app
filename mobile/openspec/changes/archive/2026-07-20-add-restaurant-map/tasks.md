## 1. Dependency and config

- [x] 1.1 Add `react-native-maps` and its Expo config plugin to `package.json` and `app.json`
- [x] 1.2 Add the Android Google Maps API key field to app config (placeholder/env-driven; iOS uses Apple Maps, no key) and document it

## 2. Map component

- [x] 2.1 Add `src/components/restaurant/mapStyle.ts`: the dark Google Maps style array (Android) plus a default fallback region
- [x] 2.2 Add `src/components/restaurant/RestaurantMap.tsx`: a `MapView` with dark styling (`userInterfaceStyle="dark"` on iOS, `customMapStyle` on Android) and a `surfaceApp` container background
- [x] 2.3 Filter restaurants to those with both finite `latitude` and `longitude` and render one `Marker` per restaurant, keyed by id; omit the rest
- [x] 2.4 Derive the initial region from the markers' bounding box, falling back to the default region when there are none

## 3. Callout and See offers

- [x] 3.1 Render a marker `Callout` showing the restaurant name and a "See offers" action
- [x] 3.2 Track a selected restaurant id in the Map screen and render a dismissible sheet (`Modal`/overlay) containing the restaurant name and `<OfferList restaurantId={id} />`
- [x] 3.3 Verify the sheet reuses `useRestaurantOffers` / the shared React Query cache (no new data path)

## 4. Map tab screen

- [x] 4.1 Replace `app/(tabs)/map.tsx` (placeholder) with the Map tab rendering `RestaurantMap` over `useRestaurants()`
- [x] 4.2 Render loading and error states mirroring the Dashboard; safe-area aware

## 5. Verification

- [x] 5.1 Add tests with `react-native-maps` mocked: assert marker count equals the coordinate-bearing restaurants, coordinate-less ones are omitted, and "See offers" opens the offers sheet
- [x] 5.2 `npx tsc --noEmit` passes and `npx jest` is green
- [ ] 5.3 Run the Map tab on a device/simulator: markers render on a dark map, a callout opens with name + "See offers", and "See offers" shows the restaurant's offers
