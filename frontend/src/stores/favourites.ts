import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createFavourite, getFavourites, updateFavourite } from '../api/favourites'
import type { Favourite } from '../types/favourite'

export const useFavouritesStore = defineStore('favourites', () => {
  const byRestaurantId = ref<Record<string, Favourite>>({})
  const pending = ref<Set<string>>(new Set())
  let loaded = false

  async function loadFavourites(): Promise<void> {
    if (loaded) return
    const rows = await getFavourites()
    const index: Record<string, Favourite> = {}
    for (const favourite of rows) {
      index[favourite.restaurantId] = favourite
    }
    byRestaurantId.value = index
    loaded = true
  }

  function favouriteFor(restaurantId: string): Favourite | undefined {
    return byRestaurantId.value[restaurantId]
  }

  function isPending(restaurantId: string): boolean {
    return pending.value.has(restaurantId)
  }

  /**
   * Create-or-update the restaurant's favourite (no upsert endpoint exists): PUT the
   * existing one with its If-Match token, or POST a new one, then cache the response.
   * Throws on API failure so callers can surface it.
   */
  async function upsert(restaurantId: string, rating: number, note: string | null): Promise<void> {
    if (pending.value.has(restaurantId)) return
    pending.value.add(restaurantId)
    try {
      const existing = byRestaurantId.value[restaurantId]
      const input = { restaurantId, rating, note }
      const saved = existing
        ? await updateFavourite(existing.id, input, existing.concurrencyToken)
        : await createFavourite(input)
      byRestaurantId.value = { ...byRestaurantId.value, [restaurantId]: saved }
    } finally {
      pending.value.delete(restaurantId)
    }
  }

  return { byRestaurantId, loadFavourites, favouriteFor, isPending, upsert }
})
