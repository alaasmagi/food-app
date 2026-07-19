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

  it('loads restaurants for a viewport and sends the bounds as query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([restaurant('a'), restaurant('b')]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useRestaurantsStore()
    await store.loadInBounds({ minLat: 59.3, minLon: 24.55, maxLat: 59.58, maxLon: 24.95 }, 250)

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('minLat=59.3')
    expect(url).toContain('minLon=24.55')
    expect(url).toContain('maxLat=59.58')
    expect(url).toContain('maxLon=24.95')
    expect(url).toContain('limit=250')
    expect(store.areaList).toHaveLength(2)
    expect(store.areaTruncated).toBe(false)
    expect(store.areaLoading).toBe(false)
  })

  it('flags truncation when the viewport hits the fetch cap', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([restaurant('a'), restaurant('b')])))

    const store = useRestaurantsStore()
    // limit === result count -> assume there is more to show.
    await store.loadInBounds({ minLat: 0, minLon: 0, maxLat: 1, maxLon: 1 }, 2)

    expect(store.areaTruncated).toBe(true)
  })

  it('keeps only the latest viewport result when fetches overlap', async () => {
    const first = json([restaurant('old')])
    const second = json([restaurant('new-1'), restaurant('new-2')])
    // First call resolves later than the second, so the stale result must not win.
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(new Promise((resolve) => setTimeout(() => resolve(first), 20)))
      .mockReturnValueOnce(Promise.resolve(second))
    vi.stubGlobal('fetch', fetchMock)

    const store = useRestaurantsStore()
    const stale = store.loadInBounds({ minLat: 0, minLon: 0, maxLat: 1, maxLon: 1 }, 250)
    const fresh = store.loadInBounds({ minLat: 1, minLon: 1, maxLat: 2, maxLon: 2 }, 250)
    await Promise.all([stale, fresh])

    expect(store.areaList.map((r) => r.id)).toEqual(['new-1', 'new-2'])
  })

  it('records a viewport error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('', 500)))

    const store = useRestaurantsStore()
    await store.loadInBounds({ minLat: 0, minLon: 0, maxLat: 1, maxLon: 1 }, 250)

    expect(store.areaError).toBeTruthy()
    expect(store.areaLoading).toBe(false)
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
