import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddRestaurantsDialog from './AddRestaurantsDialog.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
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

function mountDialog() {
  return mount(AddRestaurantsDialog, {
    props: { open: true, environmentId: 'e1', environmentName: 'Work' },
  })
}

describe('AddRestaurantsDialog', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lists only restaurants that are not already members', () => {
    const restaurants = useRestaurantsStore()
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')]
    const environments = useEnvironmentsStore()
    environments.membershipByEnv['e1'] = { r1: { joinId: 'm1', concurrencyToken: 't' } }

    const wrapper = mountDialog()
    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Beta'])
  })

  it('filters the candidates by name or city as you type', async () => {
    const restaurants = useRestaurantsStore()
    restaurants.list = [
      restaurant('r1', 'Alpha', 'Tallinn'),
      restaurant('r2', 'Beta', 'Tartu'),
      restaurant('r3', 'Gamma', 'Tallinn'),
    ]
    useEnvironmentsStore()

    const wrapper = mountDialog()
    await wrapper.find('input').setValue('tartu')
    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Beta'])
  })

  it('adds a restaurant and drops it from the list', async () => {
    const restaurants = useRestaurantsStore()
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')]
    const environments = useEnvironmentsStore()
    // Emulate the store action writing the membership row on success.
    const addSpy = vi.spyOn(environments, 'addRestaurant').mockImplementation(async (id: string) => {
      ;(environments.membershipByEnv['e1'] ??= {})[id] = { joinId: 'm', concurrencyToken: 't' }
    })

    const wrapper = mountDialog()
    const addAlpha = wrapper.findAll('.picker__row').find((r) => r.text().includes('Alpha'))!
    await addAlpha.find('button').trigger('click')
    await flushPromises()

    expect(addSpy).toHaveBeenCalledWith('r1')
    // Alpha is now a member, so only Beta remains offerable.
    expect(wrapper.findAll('.picker__name').map((n) => n.text())).toEqual(['Beta'])
  })

  it('shows an all-added message when nothing remains to add', () => {
    const restaurants = useRestaurantsStore()
    restaurants.list = [restaurant('r1', 'Alpha')]
    const environments = useEnvironmentsStore()
    environments.membershipByEnv['e1'] = { r1: { joinId: 'm1', concurrencyToken: 't' } }

    const wrapper = mountDialog()
    expect(wrapper.find('.picker__empty').text()).toContain('Every restaurant is already in Work')
  })
})
