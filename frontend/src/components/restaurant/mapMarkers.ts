import type { Restaurant } from '../../types/restaurant'

/**
 * Whether a restaurant has a usable map location.
 *
 * The backend `RestaurantDto` types latitude/longitude as non-nullable numbers,
 * so an unset location arrives as the 0/0 sentinel ("null island") rather than
 * null. Restaurants at 0/0, out of range, or non-finite are treated as having no
 * location and are silently excluded from the map.
 */
export function hasCoordinates(restaurant: Restaurant): boolean {
  const { latitude, longitude } = restaurant
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (latitude === 0 && longitude === 0) return false
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

/** The subset of restaurants that can be placed on the map. */
export function markerableRestaurants(restaurants: Restaurant[]): Restaurant[] {
  return restaurants.filter(hasCoordinates)
}
