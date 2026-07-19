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
      // The "All" list view fetches a page envelope; checked before the bare-array /restaurants.
      if (url.includes('/restaurants/page')) {
        return Promise.resolve(
          json({ items: restaurants, total: restaurants.length, page: 1, pageSize: 20 }),
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

// Environment selection uses underline tabs (.ds-tabs__tab); the List/Map view
// switch is a separate segmented control (.dashboard__view-btn).
function envTabs(wrapper: VueWrapper) {
  return wrapper.find('.dashboard__tabs').findAll('.ds-tabs__tab')
}
function viewTabs(wrapper: VueWrapper) {
  return wrapper.find('.dashboard__view-toggle').findAll('.dashboard__view-btn')
}

// Leaflet cannot render in jsdom; stub the map so mounting the (now default) map view is safe and
// the set it receives can be inspected via props.
const mountWithMapStub = () =>
  mount(DashboardView, { global: { stubs: { RestaurantMap: true } } })

// The map is the default view; switch to the List tab (index 0) to assert on rendered cards.
async function showList(wrapper: VueWrapper) {
  await viewTabs(wrapper)[0].trigger('click')
  await flushPromises()
}

describe('DashboardView with a specific environment selected', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('narrows the list to the environment members, each with a Remove action', async () => {
    // r1 is a member of "Work"; r2 is not.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    // Select the "Work" tab (index 1; index 0 is "All").
    const tabs = envTabs(wrapper)
    expect(tabs.map((t) => t.text())).toEqual(['All', 'Work'])
    await tabs[1].trigger('click')
    await showList(wrapper)

    // Only the member is listed — the tab reads as a curated set, not the catalog.
    const names = wrapper.findAll('.restaurant__name').map((n) => n.text())
    expect(names).toEqual(['Alpha'])

    // Members expose Remove; the inline "Add to environment" toggle is gone
    // (adding now happens through the picker).
    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons).toContain('Remove from environment')
    expect(buttons).not.toContain('Add to environment')
    // The picker entry point is present.
    expect(buttons).toContain('Add restaurants')
  })

  it('shows an empty state and the Add picker entry when the environment has no members', async () => {
    // "Work" has no members yet — the user selects it to start adding restaurants.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], [])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await envTabs(wrapper)[1].trigger('click')
    await showList(wrapper)

    // No restaurant cards; a named empty state guides the user to the picker.
    expect(wrapper.findAll('.restaurant__name')).toHaveLength(0)
    expect(wrapper.find('.dashboard__status').text()).toContain('No restaurants in Work yet')
    expect(wrapper.findAll('button').map((b) => b.text())).toContain('Add restaurants')
  })

  it('hides membership actions and the picker entry under "All"', async () => {
    stubFetch([restaurant('r1', 'Alpha')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()
    // "All" is selected by default; switch to the list to inspect the cards.
    await showList(wrapper)

    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons).not.toContain('Add to environment')
    expect(buttons).not.toContain('Remove from environment')
    expect(buttons).not.toContain('Add restaurants')
    // The viewport set is visible under "All".
    expect(wrapper.findAll('.restaurant__name').map((n) => n.text())).toEqual(['Alpha'])
  })

  it('opens the Add-restaurants picker listing the environment non-members', async () => {
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await envTabs(wrapper)[1].trigger('click')
    // The picker entry point ("Add restaurants") only renders in the list view.
    await showList(wrapper)

    const addButton = wrapper.findAll('button').find((b) => b.text() === 'Add restaurants')!
    await addButton.trigger('click')
    await flushPromises()

    // The dialog lists Beta (the non-member) but not Alpha (already a member).
    const dialogNames = wrapper.findAll('.picker__name').map((n) => n.text())
    expect(dialogNames).toEqual(['Beta'])
  })
})

describe('DashboardView list/map toggle', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('offers a List/Map toggle and shows the map by default', async () => {
    stubFetch([restaurant('r1', 'Alpha')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    expect(viewTabs(wrapper).map((t) => t.text())).toEqual(['List', 'Map'])
    // Map is the default view: the map renders, no list cards are shown.
    expect(wrapper.findComponent(RestaurantMap).exists()).toBe(true)
    expect(wrapper.findAll('.restaurant__name').length).toBe(0)
  })

  it('passes the viewport set to the map under "All" by default', async () => {
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    const map = wrapper.findComponent(RestaurantMap)
    expect(map.exists()).toBe(true)
    // Under "All" the map receives the current viewport's restaurants.
    expect((map.props('restaurants') as Restaurant[]).map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('switching to the list shows cards, then back to the map hides them', async () => {
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')], ['r1'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await showList(wrapper)
    expect(wrapper.findComponent(RestaurantMap).exists()).toBe(false)
    expect(wrapper.findAll('.restaurant__name').length).toBe(2)

    await viewTabs(wrapper)[1].trigger('click') // Map
    await flushPromises()
    expect(wrapper.findComponent(RestaurantMap).exists()).toBe(true)
    expect(wrapper.findAll('.restaurant__name').length).toBe(0)
  })

  it('narrows both the list and the map to environment members', async () => {
    // r1 and r3 belong to "Work"; r2 does not.
    stubFetch([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')], ['r1', 'r3'])

    const wrapper = mountWithMapStub()
    await flushPromises()

    await envTabs(wrapper)[1].trigger('click') // Work
    await showList(wrapper)

    // List view shows only the environment's members now.
    expect(wrapper.findAll('.restaurant__name').map((n) => n.text())).toEqual(['Alpha', 'Gamma'])

    await viewTabs(wrapper)[1].trigger('click') // Map
    await flushPromises()

    // Map shows the same members.
    const map = wrapper.findComponent(RestaurantMap)
    expect((map.props('restaurants') as Restaurant[]).map((r) => r.id)).toEqual(['r1', 'r3'])
  })
})
