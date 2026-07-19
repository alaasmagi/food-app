import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddRestaurantsDialog from './AddRestaurantsDialog.vue'
import { useEnvironmentsStore } from '../../stores/environments'
import type { Restaurant } from '../../types/restaurant'

function restaurant(id: string, name: string, city = 'Tallinn'): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name,
    city,
    latitude: 0,
    longitude: 0,
    offerTimeText: '11:00 to 14:00',
    parkingInfo: 'Street',
    openingInfo: 'Mon to Fri',
    hasOffers: false,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  }
}

// The picker now fetches a page from GET /api/v1/restaurants/page rather than reading the full store.
function pageResponse(items: Restaurant[]) {
  return new Response(JSON.stringify({ items, total: items.length, page: 1, pageSize: 20 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mountDialog() {
  return mount(AddRestaurantsDialog, {
    props: { open: true, environmentId: 'e1', environmentName: 'Work' },
  })
}

describe('AddRestaurantsDialog', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('shows every restaurant in the page, marking existing members as "Added"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(pageResponse([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')])),
    )
    const environments = useEnvironmentsStore()
    environments.membershipByEnv['e1'] = { r1: { joinId: 'm1', concurrencyToken: 't' } }

    const wrapper = mountDialog()
    await flushPromises()

    // Members aren't filtered out (that breaks with paging) — they're shown as already added.
    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Alpha', 'Beta'])
    expect(wrapper.findAll('.picker__row button').map((b) => b.text())).toEqual(['Added', 'Add'])
  })

  it('searches server-side, showing results for the typed term', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          pageResponse(
            url.includes('search=tartu')
              ? [restaurant('r2', 'Beta', 'Tartu')]
              : [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta', 'Tartu')],
          ),
        ),
      ),
    )
    useEnvironmentsStore()

    const wrapper = mountDialog()
    await vi.runAllTimersAsync() // initial load
    expect(wrapper.findAll('.picker__name')).toHaveLength(2)

    await wrapper.find('input').setValue('tartu')
    await vi.runAllTimersAsync() // debounce fires + the filtered page loads

    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Beta'])
    vi.useRealTimers()
  })

  it('marks a restaurant as "Added" after adding it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(pageResponse([restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')])),
    )
    const environments = useEnvironmentsStore()
    // Emulate the store action writing the membership row on success.
    const addSpy = vi.spyOn(environments, 'addRestaurant').mockImplementation(async (id: string) => {
      ;(environments.membershipByEnv['e1'] ??= {})[id] = { joinId: 'm', concurrencyToken: 't' }
    })

    const wrapper = mountDialog()
    await flushPromises()

    const alphaRow = wrapper.findAll('.picker__row').find((r) => r.text().includes('Alpha'))!
    await alphaRow.find('button').trigger('click')
    await flushPromises()

    expect(addSpy).toHaveBeenCalledWith('r1')
    // Both rows stay listed; Alpha's action flips to "Added".
    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Alpha', 'Beta'])
    const alphaAgain = wrapper.findAll('.picker__row').find((r) => r.text().includes('Alpha'))!
    expect(alphaAgain.find('button').text()).toBe('Added')
  })

  it('shows a no-results message when the page is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(pageResponse([])))
    useEnvironmentsStore()

    const wrapper = mountDialog()
    await flushPromises()

    expect(wrapper.find('.picker__empty').text()).toContain('No restaurants match your search')
  })
})
