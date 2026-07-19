import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRestaurantSearch } from './useRestaurantSearch'
import type { Restaurant } from '../types/restaurant'

function restaurant(id: string, name: string): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name,
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: false,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  }
}

function page(names: string[], total = names.length) {
  return new Response(
    JSON.stringify({ items: names.map((n, i) => restaurant(`r${i}`, n)), total, page: 1, pageSize: 20 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('useRestaurantSearch', () => {
  beforeEach(() => setActivePinia(createPinia())) // apiFetch reads the auth store
  afterEach(() => vi.unstubAllGlobals())

  it('loads a page and computes total pages from the total', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page(['A', 'B'], 45)))
    const s = useRestaurantSearch(20)

    await s.load()

    expect(s.items.value.map((r) => r.name)).toEqual(['A', 'B'])
    expect(s.total.value).toBe(45)
    expect(s.totalPages.value).toBe(3) // ceil(45 / 20)
  })

  it('goToPage clamps to range and refetches with the new page number', async () => {
    const fetchMock = vi.fn().mockResolvedValue(page(['A'], 45))
    vi.stubGlobal('fetch', fetchMock)
    const s = useRestaurantSearch(20)
    await s.load()

    s.goToPage(99) // clamps to last page (3)
    expect(s.page.value).toBe(3)
    const lastUrl = fetchMock.mock.calls.at(-1)![0] as string
    expect(lastUrl).toContain('page=3')
  })

  it('reset clears state and abandons in-flight results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page(['A', 'B'])))
    const s = useRestaurantSearch(20)

    const pending = s.load()
    s.reset() // supersede the in-flight load
    await pending

    // The abandoned result must not land.
    expect(s.items.value).toEqual([])
    expect(s.total.value).toBe(0)
    expect(s.page.value).toBe(1)
  })

  it('records an error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    const s = useRestaurantSearch(20)

    await s.load()

    expect(s.error.value).toBeTruthy()
    expect(s.loading.value).toBe(false)
  })
})
