import type { Restaurant } from '../../types/restaurant'

// Backend coordinates are non-nullable, so an unset location arrives as the 0/0 sentinel.
export function hasCoordinates(restaurant: Restaurant): boolean {
  const { latitude, longitude } = restaurant
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (latitude === 0 && longitude === 0) return false
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function markerableRestaurants(restaurants: Restaurant[]): Restaurant[] {
  return restaurants.filter(hasCoordinates)
}
