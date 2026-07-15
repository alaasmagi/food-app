import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getRestaurantOffers, getRestaurants } from '../api/restaurants'
import type { DailyOffer, Restaurant } from '../types/restaurant'

export interface OffersEntry {
  offers: DailyOffer[]
  loading: boolean
  error: string | null
  loaded: boolean
}

export const useRestaurantsStore = defineStore('restaurants', () => {
  // Catalog: fetched once, cached in memory.
  const list = ref<Restaurant[]>([])
  const listLoaded = ref(false)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  // Per-restaurant offers cache, keyed by restaurant id. Fetched lazily.
  const offersById = ref<Record<string, OffersEntry>>({})

  let listPending: Promise<void> | null = null

  async function loadRestaurants(): Promise<void> {
    if (listLoaded.value) return
    if (listPending) return listPending
    listPending = (async () => {
      listLoading.value = true
      listError.value = null
      try {
        list.value = await getRestaurants()
        listLoaded.value = true
      } catch (e) {
        listError.value = e instanceof Error ? e.message : 'Failed to load restaurants'
      } finally {
        listLoading.value = false
        listPending = null
      }
    })()
    return listPending
  }

  /** Fetch one restaurant's offers lazily. No-ops if already loaded or in flight. */
  async function loadOffers(id: string): Promise<void> {
    const existing = offersById.value[id]
    if (existing && (existing.loaded || existing.loading)) return

    offersById.value[id] = { offers: [], loading: true, error: null, loaded: false }
    try {
      const offers = await getRestaurantOffers(id)
      offersById.value[id] = { offers, loading: false, error: null, loaded: true }
    } catch (e) {
      offersById.value[id] = {
        offers: [],
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load offers',
        loaded: false,
      }
    }
  }

  function offersFor(id: string): OffersEntry | undefined {
    return offersById.value[id]
  }

  return {
    list,
    listLoaded,
    listLoading,
    listError,
    offersById,
    loadRestaurants,
    loadOffers,
    offersFor,
  }
})
