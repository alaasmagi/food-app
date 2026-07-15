import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRestaurantsStore } from './restaurants'
import type { Restaurant } from '../types/restaurant'

function restaurant(id: string, over: Partial<Restaurant> = {}): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name: `Restaurant ${id}`,
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '11:00 to 14:00',
    parkingInfo: 'Street parking',
    openingInfo: 'Mon to Fri',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
    ...over,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('restaurants store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the catalog once and caches it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([restaurant('a'), restaurant('b')]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useRestaurantsStore()
    await store.loadRestaurants()
    await store.loadRestaurants()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.list).toHaveLength(2)
    expect(store.listLoaded).toBe(true)
  })

  it('de-duplicates concurrent catalog loads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([restaurant('a')]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useRestaurantsStore()
    await Promise.all([store.loadRestaurants(), store.loadRestaurants()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('records a catalog error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('', 500)))

    const store = useRestaurantsStore()
    await store.loadRestaurants()

    expect(store.listError).toBeTruthy()
    expect(store.listLoaded).toBe(false)
    expect(store.list).toHaveLength(0)
  })

  it('fetches offers lazily per restaurant and caches them', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{ offerText: 'Soup', offerPrice: '3.50 EUR' }]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useRestaurantsStore()
    await store.loadOffers('a')
    await store.loadOffers('a')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/restaurants/a/offers')
    expect(store.offersFor('a')?.offers).toHaveLength(1)
    expect(store.offersFor('a')?.loaded).toBe(true)
    expect(store.offersFor('a')?.loading).toBe(false)
  })

  it('records a per-restaurant offers error in isolation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('', 500)))

    const store = useRestaurantsStore()
    await store.loadOffers('a')

    const entry = store.offersFor('a')
    expect(entry?.loading).toBe(false)
    expect(entry?.error).toBeTruthy()
    expect(entry?.loaded).toBe(false)
    // a different restaurant is untouched
    expect(store.offersFor('b')).toBeUndefined()
  })
})
