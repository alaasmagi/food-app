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

export interface MarkerBox {
  id: string
  rect: { left: number; top: number; right: number; bottom: number }
  offers: boolean
  selected: boolean
}

function priority(box: MarkerBox): number {
  if (box.selected) return 0
  return box.offers ? 1 : 2
}

// Keeps pills in priority order (selected, offers, rest; list order within each) and returns the ids that would overlap a kept one.
export function collapsedIds(boxes: MarkerBox[]): Set<string> {
  const kept: MarkerBox['rect'][] = []
  const collapsed = new Set<string>()
  const ordered = [...boxes].sort((a, b) => priority(a) - priority(b))
  for (const { id, rect } of ordered) {
    const overlaps = kept.some(
      (k) => rect.left < k.right && rect.right > k.left && rect.top < k.bottom && rect.bottom > k.top,
    )
    if (overlaps) collapsed.add(id)
    else kept.push(rect)
  }
  return collapsed
}
