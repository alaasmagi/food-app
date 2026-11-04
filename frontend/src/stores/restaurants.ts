import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getRestaurantOffers,
  getRestaurants,
  getRestaurantsInBounds,
  getRestaurantsPage,
} from '../api/restaurants'
import type { Bounds, DailyOffer, Restaurant } from '../types/restaurant'

export interface OffersEntry {
  offers: DailyOffer[]
  loading: boolean
  error: string | null
  loaded: boolean
}

// Mirrors the backend's default per-viewport cap; a full result means the viewport holds more.
export const DEFAULT_AREA_LIMIT = 250

export const useRestaurantsStore = defineStore('restaurants', () => {
  // Full catalog, fetched once, for surfaces that need every restaurant regardless of the map.
  const list = ref<Restaurant[]>([])
  const listLoaded = ref(false)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  // Viewport results, replaced on every map search.
  const areaList = ref<Restaurant[]>([])
  const areaLoading = ref(false)
  const areaError = ref<string | null>(null)
  const areaTruncated = ref(false)

  // List view (All tab): one server-side page at a time, kept separate from the viewport set.
  const pagedList = ref<Restaurant[]>([])
  const pagedTotal = ref(0)
  const pagedLoading = ref(false)
  const pagedError = ref<string | null>(null)

  const offersById = ref<Record<string, OffersEntry>>({})

  let listPending: Promise<void> | null = null
  // Monotonic tokens so an earlier, slower fetch can't overwrite a newer one's results.
  let areaRequestId = 0
  let pageRequestId = 0
  // Collapses identical bounds fetches into one request so they don't hammer the rate limiter.
  let lastBoundsKey: string | null = null

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

  async function loadInBounds(bounds: Bounds, limit: number = DEFAULT_AREA_LIMIT): Promise<void> {
    // Coordinates rounded (~1m) so float jitter from repeated getBounds() reads doesn't defeat the dedupe.
    const key = [bounds.minLat, bounds.minLon, bounds.maxLat, bounds.maxLon]
      .map((n) => n.toFixed(5))
      .join(',') + `@${limit}`
    if (key === lastBoundsKey) return // same viewport already loaded / in flight
    lastBoundsKey = key

    const requestId = ++areaRequestId
    areaLoading.value = true
    areaError.value = null
    try {
      const results = await getRestaurantsInBounds(bounds, limit)
      if (requestId !== areaRequestId) return // a newer fetch already superseded this one
      areaList.value = results
      areaTruncated.value = results.length >= limit
    } catch (e) {
      if (requestId !== areaRequestId) return
      areaError.value = e instanceof Error ? e.message : 'Failed to load restaurants'
      lastBoundsKey = null // let the same viewport be retried after a failure
    } finally {
      if (requestId === areaRequestId) areaLoading.value = false
    }
  }

  async function loadPage(params: {
    page: number
    pageSize: number
    search?: string
  }): Promise<void> {
    const requestId = ++pageRequestId
    pagedLoading.value = true
    pagedError.value = null
    try {
      const result = await getRestaurantsPage(params)
      if (requestId !== pageRequestId) return // a newer page/search superseded this one
      pagedList.value = result.items
      pagedTotal.value = result.total
    } catch (e) {
      if (requestId !== pageRequestId) return
      pagedError.value = e instanceof Error ? e.message : 'Failed to load restaurants'
    } finally {
      if (requestId === pageRequestId) pagedLoading.value = false
    }
  }

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
    areaList,
    areaLoading,
    areaError,
    areaTruncated,
    pagedList,
    pagedTotal,
    pagedLoading,
    pagedError,
    offersById,
    loadRestaurants,
    loadInBounds,
    loadPage,
    loadOffers,
    offersFor,
  }
})
