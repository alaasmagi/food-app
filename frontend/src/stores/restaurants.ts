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

// Cap on restaurants fetched per map viewport; mirrors the backend's default. When a fetch returns
// this many, the viewport is assumed to hold more and the UI hints the user to zoom in.
export const DEFAULT_AREA_LIMIT = 250

export const useRestaurantsStore = defineStore('restaurants', () => {
  // Full catalog: fetched once, cached in memory. Used by the wheel, environments and the
  // "add restaurants" picker — surfaces that need every restaurant regardless of the map.
  const list = ref<Restaurant[]>([])
  const listLoaded = ref(false)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  // Map/viewport results: replaced on every pan/zoom, so the dashboard map and list show only
  // the restaurants a user is currently looking at rather than the entire catalog.
  const areaList = ref<Restaurant[]>([])
  const areaLoading = ref(false)
  const areaError = ref<string | null>(null)
  const areaTruncated = ref(false)

  // List view (All tab): one server-side page at a time, name/city searchable. Kept separate from
  // the viewport set so the list can be a browse/search surface without fetching the whole catalog.
  const pagedList = ref<Restaurant[]>([])
  const pagedTotal = ref(0)
  const pagedLoading = ref(false)
  const pagedError = ref<string | null>(null)

  // Per-restaurant offers cache, keyed by restaurant id. Fetched lazily.
  const offersById = ref<Record<string, OffersEntry>>({})

  let listPending: Promise<void> | null = null
  // Monotonic tokens so an earlier, slower fetch can't overwrite a newer one's results.
  let areaRequestId = 0
  let pageRequestId = 0
  // Last viewport requested, so an identical bounds fetch (e.g. the map's initial emit plus the
  // moveend from its own setView) collapses into one request instead of hammering the rate limiter.
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

  /**
   * Fetch the restaurants inside the given map viewport and replace `areaList`. Concurrent calls
   * (rapid panning) are guarded by a request token so only the latest result is kept.
   */
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

  /**
   * Load one page of the searchable list into `pagedList`. Concurrent calls (typing in search,
   * clicking next) are guarded by a request token so only the latest result is kept.
   */
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
