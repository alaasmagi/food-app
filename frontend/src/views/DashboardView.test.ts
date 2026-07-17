import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from './DashboardView.vue'
import RestaurantMap from '../components/restaurant/RestaurantMap.vue'
import type { Restaurant } from '../types/restaurant'

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function restaurant(id: string, name: string, over: Partial<Restaurant> = {}): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name,
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '11:00 to 14:00',
    parkingInfo: 'Street',
    openingInfo: 'Mon to Fri',
    hasOffers: false,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
    ...over,
  }
}

/**
 * Stubs every dashboard load. `members` lists the restaurant ids that belong to
 * environment "e1"; everything else is a non-member of that environment.
 */
function stubFetch(restaurants: Restaurant[], members: string[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('dining-environments')) {
        return Promise.resolve(json([{ id: 'e1', concurrencyToken: 't', name: 'Work', description: null }]))
      }
      if (url.includes('environment-restaurants')) {
        return Promise.resolve(
          json(members.map((rid, i) => ({ id: `m${i}`, concurrencyToken: 't', environmentId: 'e1', restaurantId: rid }))),
        )
      }
      if (url.includes('/restaurants')) {
        return Promise.resolve(json(restaurants))
      }
      // favourites and anything else
      return Promise.resolve(json([]))
    }),
  )
}

// The environment tabs and the view tabs both render `.ds-tabs__tab`, so scope
// each query to its own container.
function envTabs(wrapper: VueWrapper) {
  return wrapper.find('.dashboard__tabs').findAll('.ds-tabs__tab')
}
function viewTabs(wrapper: VueWrapper) {
  return wrapper.find('.dashboard__view-tabs').findAll('.ds-tabs__tab')
}

describe('DashboardView with a specific environment selected', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the full catalog visible and exposes Add/Remove per membership', async () => {
    // r1 is a member of "Work"; r2 is not.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mount(DashboardView)
    await flushPromises()

    // Select the "Work" tab (index 1; index 0 is "All").
    const tabs = envTabs(wrapper)
    expect(tabs.map((t) => t.text())).toEqual(['All', 'Work'])
    await tabs[1].trigger('click')
    await flushPromises()

    // Both restaurants stay visible — selecting an environment must not filter
    // out non-members, otherwise "Add to environment" is unreachable.
    const names = wrapper.findAll('.restaurant__name').map((n) => n.text())
    expect(names).toEqual(['Alpha', 'Beta'])

    // The member shows Remove; the non-member shows Add.
    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons).toContain('Remove from environment')
    expect(buttons).toContain('Add to environment')
  })

  it('shows the whole catalog with Add actions when the selected environment is empty', async () => {
    // "Work" has no members yet — the user selects it to start adding restaurants.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], [])

    const wrapper = mount(DashboardView)
    await flushPromises()

    await envTabs(wrapper)[1].trigger('click')
    await flushPromises()

    // No "No restaurants" empty state — every restaurant is addable.
    expect(wrapper.find('.dashboard__status').exists()).toBe(false)
    const names = wrapper.findAll('.restaurant__name').map((n) => n.text())
    expect(names).toEqual(['Alpha', 'Beta'])
    const addButtons = wrapper.findAll('button').filter((b) => b.text() === 'Add to environment')
    expect(addButtons).toHaveLength(2)
  })

  it('hides membership actions under "All"', async () => {
    stubFetch([restaurant('r1', 'Alpha')], ['r1'])

    const wrapper = mount(DashboardView)
    await flushPromises()

    // "All" is selected by default.
    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons).not.toContain('Add to environment')
    expect(buttons).not.toContain('Remove from environment')
  })
})

describe('DashboardView list/map toggle', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  // Leaflet cannot render in jsdom; stub the map and inspect the set it receives.
  const mountWithMapStub = () =>
    mount(DashboardView, { global: { stubs: { RestaurantMap: true } } })

  it('offers a List/Map toggle and shows the list by default', async () => {
    stubFetch([restaurant('r1', 'Alpha')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    expect(viewTabs(wrapper).map((t) => t.text())).toEqual(['List', 'Map'])
    // List is the default view: cards render, the map does not.
    expect(wrapper.findAll('.restaurant__name').length).toBe(1)
    expect(wrapper.findComponent(RestaurantMap).exists()).toBe(false)
  })

  it('switches to the map view and passes the full catalog under "All"', async () => {
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await viewTabs(wrapper)[1].trigger('click') // Map
    await flushPromises()

    const map = wrapper.findComponent(RestaurantMap)
    expect(map.exists()).toBe(true)
    // No restaurant cards while the map view is active.
    expect(wrapper.findAll('.restaurant__name').length).toBe(0)
    // Under "All" the map receives every restaurant.
    expect((map.props('restaurants') as Restaurant[]).map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('narrows the map to environment members while the list stays full', async () => {
    // r1 and r3 belong to "Work"; r2 does not.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')], ['r1', 'r3'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await envTabs(wrapper)[1].trigger('click') // Work
    await flushPromises()

    // List view still shows the full catalog (membership management).
    expect(wrapper.findAll('.restaurant__name').map((n) => n.text())).toEqual(['Alpha', 'Beta', 'Gamma'])

    await viewTabs(wrapper)[1].trigger('click') // Map
    await flushPromises()

    // Map shows only the environment's members.
    const map = wrapper.findComponent(RestaurantMap)
    expect((map.props('restaurants') as Restaurant[]).map((r) => r.id)).toEqual(['r1', 'r3'])
  })
})
