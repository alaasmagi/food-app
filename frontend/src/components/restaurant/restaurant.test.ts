import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RestaurantCard from './RestaurantCard.vue'
import OfferList from './OfferList.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import type { OffersEntry } from '../../stores/restaurants'
import type { Restaurant } from '../../types/restaurant'

function restaurant(over: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'a',
    concurrencyToken: '',
    name: 'Bistro',
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

describe('RestaurantCard', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('shows the fast food badge only when isFastFood', () => {
    expect(
      mount(RestaurantCard, { props: { restaurant: restaurant({ isFastFood: true }) } }).text(),
    ).toContain('Fast food')
    expect(
      mount(RestaurantCard, { props: { restaurant: restaurant({ isFastFood: false }) } }).text(),
    ).not.toContain('Fast food')
  })

  it('shows the no-offers badge when hasOffers is false', () => {
    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant({ hasOffers: false }) } })
    expect(wrapper.text()).toContain('No offers today')
  })

  it('renders the city tag and restaurant details', () => {
    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.text()).toContain('Tallinn')
    expect(wrapper.text()).toContain('11:00 to 14:00')
    expect(wrapper.text()).toContain('Street parking')
  })

  it('hides "Show on map" for a restaurant without coordinates', () => {
    // Default fixture is at the 0/0 sentinel (no location).
    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.text()).not.toContain('Show on map')
  })

  it('emits show-on-map with the restaurant when located', async () => {
    const located = restaurant({ latitude: 59.43, longitude: 24.75 })
    const wrapper = mount(RestaurantCard, { props: { restaurant: located } })

    const button = wrapper.findAll('button').find((b) => b.text() === 'Show on map')!
    await button.trigger('click')

    expect(wrapper.emitted('showOnMap')?.[0]).toEqual([located])
  })

  it('loads offers and expands the list when "See offers" is clicked', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{ offerText: 'Soup', offerPrice: '3.50 EUR' }]))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.findComponent(OfferList).exists()).toBe(false)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(OfferList).exists()).toBe(true)
    expect(wrapper.text()).toContain('Soup')
    expect(wrapper.text()).toContain('3.50 EUR')
  })
})

describe('OfferList', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountWith(entry: OffersEntry) {
    const store = useRestaurantsStore()
    store.offersById['a'] = entry
    return mount(OfferList, { props: { restaurantId: 'a' } })
  }

  it('shows the loading state', () => {
    const wrapper = mountWith({ offers: [], loading: true, error: null, loaded: false })
    expect(wrapper.text()).toContain('Loading offers')
  })

  it('shows the empty state, not an error, when loaded with no offers', () => {
    const wrapper = mountWith({ offers: [], loading: false, error: null, loaded: true })
    expect(wrapper.text()).toContain('No offers available')
    expect(wrapper.find('.offers__status--error').exists()).toBe(false)
  })

  it('shows an inline error only on a genuine failure', () => {
    const wrapper = mountWith({ offers: [], loading: false, error: 'boom', loaded: false })
    expect(wrapper.find('.offers__status--error').exists()).toBe(true)
  })

  it('renders offer text and price pairs', () => {
    const wrapper = mountWith({
      offers: [
        { offerText: 'Soup', offerPrice: '3.50 EUR' },
        { offerText: 'Salad', offerPrice: null },
      ],
      loading: false,
      error: null,
      loaded: true,
    })
    expect(wrapper.findAll('.offers__item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Soup')
    expect(wrapper.text()).toContain('3.50 EUR')
    expect(wrapper.text()).toContain('Salad')
  })
})
