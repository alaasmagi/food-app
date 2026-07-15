import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFavouritesStore } from './favourites'
import type { Favourite } from '../types/favourite'

function fav(over: Partial<Favourite> = {}): Favourite {
  return {
    id: 'f1',
    concurrencyToken: 'tok-f1',
    restaurantId: 'r1',
    rating: 4,
    note: null,
    ...over,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('favourites store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('loads favourites once and indexes them by restaurantId', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json([fav({ id: 'f1', restaurantId: 'r1' }), fav({ id: 'f2', restaurantId: 'r2' })]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useFavouritesStore()
    await store.loadFavourites()
    await store.loadFavourites()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.favouriteFor('r1')?.id).toBe('f1')
    expect(store.favouriteFor('r2')?.id).toBe('f2')
  })

  it('upsert POSTs when no favourite exists for the restaurant', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(fav({ id: 'new', restaurantId: 'r9', rating: 3 }), 201))
    vi.stubGlobal('fetch', fetchMock)

    const store = useFavouritesStore()
    await store.upsert('r9', 3, 'Great lunch')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/favourites')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ restaurantId: 'r9', rating: 3, note: 'Great lunch' })
    expect(store.favouriteFor('r9')?.id).toBe('new')
  })

  it('upsert PUTs with If-Match when a favourite already exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(fav({ id: 'f1', restaurantId: 'r1', rating: 5 })))
    vi.stubGlobal('fetch', fetchMock)

    const store = useFavouritesStore()
    store.byRestaurantId['r1'] = fav({ id: 'f1', restaurantId: 'r1', rating: 2, concurrencyToken: 'tok-f1' })

    await store.upsert('r1', 5, null)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/favourites/f1')
    expect(init.method).toBe('PUT')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-f1')
    expect(store.favouriteFor('r1')?.rating).toBe(5)
  })
})
