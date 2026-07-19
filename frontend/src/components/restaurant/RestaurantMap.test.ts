import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Restaurant } from '../../types/restaurant'
import { hasCoordinates, markerableRestaurants } from './mapMarkers'

// Leaflet cannot lay out a real map in jsdom, so the module is mocked with
// chainable stubs. L.marker is a spy so we can assert how many markers are made.
vi.mock('leaflet', () => {
  const marker = vi.fn(() => ({ on: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() }))
  const tileLayer = vi.fn(() => ({ addTo: vi.fn().mockReturnThis() }))
  const layerGroup = vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
  }))
  const popup = vi.fn(() => ({
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    openOn: vi.fn().mockReturnThis(),
  }))
  const map = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    closePopup: vi.fn(),
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
    setView: vi.fn(),
    remove: vi.fn(),
    getBounds: vi.fn(() => ({
      getSouthWest: () => ({ lat: 59.3, lng: 24.55 }),
      getNorthEast: () => ({ lat: 59.58, lng: 24.95 }),
    })),
  }))
  const L = {
    map,
    tileLayer,
    layerGroup,
    popup,
    marker,
    divIcon: vi.fn(() => ({})),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    latLngBounds: vi.fn((points: unknown) => ({ points })),
  }
  return { default: L }
})

import L from 'leaflet'
import RestaurantMap from './RestaurantMap.vue'

function restaurant(id: string, over: Partial<Restaurant> = {}): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name: `R ${id}`,
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
    ...over,
  }
}

describe('mapMarkers coordinate gating', () => {
  it('accepts real, in-range, non-zero coordinates', () => {
    expect(hasCoordinates(restaurant('a', { latitude: 59.43, longitude: 24.75 }))).toBe(true)
  })

  it('rejects the 0/0 sentinel', () => {
    expect(hasCoordinates(restaurant('a', { latitude: 0, longitude: 0 }))).toBe(false)
  })

  it('rejects non-finite and out-of-range coordinates', () => {
    expect(hasCoordinates(restaurant('a', { latitude: Number.NaN, longitude: 24.75 }))).toBe(false)
    expect(hasCoordinates(restaurant('a', { latitude: 200, longitude: 24.75 }))).toBe(false)
  })

  it('markerableRestaurants keeps only located restaurants', () => {
    const list = [
      restaurant('a', { latitude: 59.43, longitude: 24.75 }),
      restaurant('b'), // 0/0 sentinel
      restaurant('c', { latitude: 58.38, longitude: 26.72 }),
    ]
    expect(markerableRestaurants(list).map((r) => r.id)).toEqual(['a', 'c'])
  })
})

describe('RestaurantMap component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('mounts and creates one marker per located restaurant, without fetching', async () => {
    const restaurants = [
      restaurant('a', { latitude: 59.43, longitude: 24.75 }),
      restaurant('b'), // 0/0 -> excluded
      restaurant('c', { latitude: 58.38, longitude: 26.72 }),
    ]
    const wrapper = mount(RestaurantMap, { props: { restaurants } })
    await flushPromises()

    expect(L.map).toHaveBeenCalledTimes(1)
    expect(L.marker).toHaveBeenCalledTimes(2)
    // The map is a pure viewer: mounting it issues no restaurant/offers fetch.
    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.find('.restaurant-map__empty').exists()).toBe(false)
  })

  it('shows an empty hint and no markers when nothing is located', async () => {
    const wrapper = mount(RestaurantMap, { props: { restaurants: [restaurant('a'), restaurant('b')] } })
    await flushPromises()

    expect(L.marker).not.toHaveBeenCalled()
    expect(wrapper.find('.restaurant-map__empty').exists()).toBe(true)
  })

  it('emits its viewport bounds on mount so the parent can fetch that area', async () => {
    const wrapper = mount(RestaurantMap, {
      props: { restaurants: [restaurant('a', { latitude: 59.43, longitude: 24.75 })] },
    })
    await flushPromises()

    const emitted = wrapper.emitted('boundsChange')
    expect(emitted).toHaveLength(1)
    expect(emitted![0][0]).toEqual({ minLat: 59.3, minLon: 24.55, maxLat: 59.58, maxLon: 24.95 })
  })

  it('does not auto-fetch on a user move; it offers "Search this area" instead', async () => {
    const wrapper = mount(RestaurantMap, {
      props: { restaurants: [restaurant('a', { latitude: 59.43, longitude: 24.75 })] },
    })
    await flushPromises()

    // Only the initial mount fetch so far, and no button yet.
    expect(wrapper.emitted('boundsChange')).toHaveLength(1)
    expect(wrapper.find('.restaurant-map__search-area').exists()).toBe(false)

    // Simulate the user panning: fire the registered moveend handler.
    const mapInstance = (L.map as unknown as { mock: { results: { value: { on: ReturnType<typeof vi.fn> } }[] } })
      .mock.results[0].value
    const moveEnd = mapInstance.on.mock.calls.find((c: unknown[]) => c[0] === 'moveend')![1] as () => void
    moveEnd()
    await flushPromises()

    // The move surfaced the button but issued no new fetch.
    expect(wrapper.find('.restaurant-map__search-area').exists()).toBe(true)
    expect(wrapper.emitted('boundsChange')).toHaveLength(1)

    // Clicking it fetches the current viewport and dismisses the button.
    await wrapper.find('.restaurant-map__search-area button').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('boundsChange')).toHaveLength(2)
    expect(wrapper.find('.restaurant-map__search-area').exists()).toBe(false)
  })

  it('in autoFit mode fits to markers and does not drive fetching', async () => {
    const wrapper = mount(RestaurantMap, {
      props: {
        restaurants: [restaurant('a', { latitude: 59.43, longitude: 24.75 })],
        autoFit: true,
      },
    })
    await flushPromises()

    const mapInstance = (
      L.map as unknown as { mock: { results: { value: { fitBounds: ReturnType<typeof vi.fn> } }[] } }
    ).mock.results[0].value
    expect(mapInstance.fitBounds).toHaveBeenCalled()
    expect(wrapper.emitted('boundsChange')).toBeUndefined()
  })

  it('removes the map instance on unmount', async () => {
    const wrapper = mount(RestaurantMap, {
      props: { restaurants: [restaurant('a', { latitude: 59.43, longitude: 24.75 })] },
    })
    await flushPromises()
    const mapInstance = (L.map as unknown as { mock: { results: { value: { remove: ReturnType<typeof vi.fn> } }[] } }).mock.results[0].value
    wrapper.unmount()
    expect(mapInstance.remove).toHaveBeenCalledTimes(1)
  })
})
