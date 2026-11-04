import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Restaurant } from '../../types/restaurant'
import { collapsedIds, hasCoordinates, markerableRestaurants, type MarkerBox } from './mapMarkers'

// Leaflet cannot lay out a real map in jsdom, so the module is mocked with
// chainable stubs. L.marker is a spy so we can assert how many markers are made.
vi.mock('leaflet', () => {
  const marker = vi.fn(() => ({ on: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis() }))
  const tileLayer = vi.fn(() => ({ addTo: vi.fn().mockReturnThis() }))
  const layerGroup = vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    eachLayer: vi.fn(),
  }))
  const popup = vi.fn(() => ({
    options: {},
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
    point: vi.fn((x: number, y: number) => ({ x, y })),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    latLngBounds: vi.fn((points: unknown) => ({ points })),
  }
  return { default: L }
})

import L from 'leaflet'
import RestaurantMap from './RestaurantMap.vue'

type Mocked = { mock: { calls: unknown[][]; results: { value: Record<string, ReturnType<typeof vi.fn>> }[] } }

// The element each divIcon was built with, in creation order.
function iconElements(): HTMLElement[] {
  return (L.divIcon as unknown as Mocked).mock.calls.map((c) => (c[0] as { html: HTMLElement }).html)
}

function handler(target: Record<string, ReturnType<typeof vi.fn>>, event: string): (...args: unknown[]) => unknown {
  return target.on!.mock.calls.find((c: unknown[]) => c[0] === event)![1] as (...args: unknown[]) => unknown
}

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

describe('mapMarkers collapsedIds', () => {
  // Boxes 20px wide on one row; x is the left edge.
  function box(id: string, x: number, over: Partial<MarkerBox> = {}): MarkerBox {
    return { id, rect: { left: x, right: x + 20, top: 0, bottom: 10 }, offers: false, selected: false, ...over }
  }

  it('keeps every pill when nothing overlaps', () => {
    expect(collapsedIds([box('a', 0), box('b', 30)]).size).toBe(0)
  })

  it('collapses the plain marker when it overlaps an offers marker', () => {
    expect([...collapsedIds([box('a', 0), box('b', 10, { offers: true })])]).toEqual(['a'])
  })

  it('keeps the selected marker over an offers marker', () => {
    expect([...collapsedIds([box('a', 0, { offers: true }), box('b', 10, { selected: true })])]).toEqual(['a'])
  })

  it('keeps list order within the same priority', () => {
    expect([...collapsedIds([box('a', 0), box('b', 10)])]).toEqual(['b'])
  })

  it('measures against kept pills only, so a chain keeps both ends', () => {
    expect([...collapsedIds([box('a', 0), box('b', 15), box('c', 30)])]).toEqual(['b'])
  })
})

describe('RestaurantMap component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

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

  it('renders offers and plain design-system markers into the Leaflet icons', async () => {
    mount(RestaurantMap, {
      props: {
        restaurants: [
          restaurant('a', { name: 'Al Mare Grill', hasOffers: true, latitude: 59.43, longitude: 24.75 }),
          restaurant('b', { name: 'Da Vinci', latitude: 59.44, longitude: 24.76 }),
        ],
      },
    })
    await flushPromises()

    const [offers, plain] = iconElements()
    expect(offers.querySelector('.ds-map-marker--offers')?.textContent).toContain('Al Mare Grill')
    expect(offers.querySelector('svg')).not.toBeNull()
    expect(offers.textContent).toContain(', lunch offers today')
    expect(plain.querySelector('.ds-map-marker--plain')?.textContent).toContain('Da Vinci')
    expect(plain.querySelector('svg')).toBeNull()
  })

  it('collapses an overlapping plain marker to a place dot and keeps the offers pill', async () => {
    const rect = { left: 0, top: 0, right: 40, bottom: 20, width: 40, height: 20, x: 0, y: 0, toJSON: () => ({}) }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect)
    mount(RestaurantMap, {
      props: {
        restaurants: [
          restaurant('a', { name: 'Plain', latitude: 59.43, longitude: 24.75 }),
          restaurant('b', { name: 'Offers', hasOffers: true, latitude: 59.43, longitude: 24.75 }),
        ],
      },
    })
    await flushPromises()

    const [plain, offers] = iconElements()
    expect(plain.querySelector('.ds-map-dot--place')?.getAttribute('aria-label')).toBe('Plain')
    expect(offers.querySelector('.ds-map-marker--offers')).not.toBeNull()
  })

  it('shows the opened marker as selected and resets it when the popup closes', async () => {
    mount(RestaurantMap, {
      props: { restaurants: [restaurant('a', { hasOffers: true, latitude: 59.43, longitude: 24.75 })] },
    })
    await flushPromises()

    const markerInstance = (L.marker as unknown as Mocked).mock.results[0].value
    const mapInstance = (L.map as unknown as Mocked).mock.results[0].value
    const [el] = iconElements()

    await handler(markerInstance, 'click')()
    await flushPromises()
    expect(el.querySelector('.ds-map-marker--selected')).not.toBeNull()

    handler(mapInstance, 'popupclose')()
    expect(el.querySelector('.ds-map-marker--selected')).toBeNull()
  })

  it('shows the design-system legend and the hint when truncated', async () => {
    const wrapper = mount(RestaurantMap, {
      props: { restaurants: [restaurant('a', { latitude: 59.43, longitude: 24.75 })], truncated: true },
    })
    await flushPromises()

    const legend = wrapper.findAll('.restaurant-map__legend .ds-map-marker')
    expect(legend.map((m) => m.text())).toEqual(['Lunch offers today', 'No offers today'])
    expect(wrapper.find('.restaurant-map__hint').text()).toBe('Showing the closest restaurants. Zoom in to see more.')
    expect(wrapper.find('.restaurant-map__hint svg').exists()).toBe(true)
  })

  it('marks the user position with the design-system user dot', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (ok: (p: { coords: { latitude: number; longitude: number } }) => void) =>
          ok({ coords: { latitude: 59.4, longitude: 24.7 } }),
      },
    })
    mount(RestaurantMap, { props: { restaurants: [] } })
    await flushPromises()

    const dot = iconElements().at(-1)!.querySelector('.ds-map-dot--user')
    expect(dot?.getAttribute('aria-label')).toBe('Your location')
  })
})
