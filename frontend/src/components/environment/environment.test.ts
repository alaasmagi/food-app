import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EnvironmentTabs from './EnvironmentTabs.vue'
import EnvironmentEditorDialog from './EnvironmentEditorDialog.vue'
import RestaurantCard from '../restaurant/RestaurantCard.vue'
import { useEnvironmentsStore } from '../../stores/environments'
import type { DiningEnvironment } from '../../types/environment'
import type { Restaurant } from '../../types/restaurant'

function env(id: string, name: string): DiningEnvironment {
  return { id, concurrencyToken: `tok-${id}`, name, description: null }
}

function restaurant(over: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    concurrencyToken: '',
    name: 'Bistro',
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '11:00 to 14:00',
    parkingInfo: 'Street',
    openingInfo: 'Mon to Fri',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
    ...over,
  }
}

describe('EnvironmentTabs', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders an All tab plus one per environment and selects via v-model', async () => {
    const store = useEnvironmentsStore()
    store.list = [env('e1', 'Work'), env('e2', 'Home')]

    const wrapper = mount(EnvironmentTabs)
    const tabs = wrapper.findAll('.ds-tabs__tab')
    expect(tabs.map((t) => t.text())).toEqual(['All', 'Work', 'Home'])

    await tabs[1].trigger('click')
    expect(store.selectedEnvironmentId).toBe('e1')

    await tabs[0].trigger('click')
    expect(store.selectedEnvironmentId).toBeNull()
  })
})

describe('EnvironmentEditorDialog', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('requires an in-dialog confirmation before deleting', async () => {
    const store = useEnvironmentsStore()
    store.list = [env('e1', 'Work')]
    const deleteSpy = vi.spyOn(store, 'deleteEnvironment').mockResolvedValue()

    const wrapper = mount(EnvironmentEditorDialog, { props: { open: true } })

    // find the Delete button (ghost) in the row
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')!
    await deleteButton.trigger('click')

    // confirmation step shown, delete not yet called
    expect(wrapper.text()).toContain('Delete this environment?')
    expect(deleteSpy).not.toHaveBeenCalled()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === 'Confirm delete')!
    await confirmButton.trigger('click')
    await flushPromises()

    expect(deleteSpy).toHaveBeenCalledWith('e1')
  })
})

describe('RestaurantCard membership action', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('hides the membership action under "All"', () => {
    const store = useEnvironmentsStore()
    store.selectEnvironment(null)
    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.text()).not.toContain('Add to environment')
    expect(wrapper.text()).not.toContain('Remove from environment')
  })

  it('shows add under a specific environment and calls addRestaurant', async () => {
    const store = useEnvironmentsStore()
    store.selectEnvironment('e1')
    const addSpy = vi.spyOn(store, 'addRestaurant').mockResolvedValue()

    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    const addButton = wrapper.findAll('button').find((b) => b.text() === 'Add to environment')!
    expect(addButton).toBeTruthy()

    await addButton.trigger('click')
    expect(addSpy).toHaveBeenCalledWith('r1')
  })

  it('shows remove when the restaurant is already a member', () => {
    const store = useEnvironmentsStore()
    store.selectEnvironment('e1')
    store.membershipByEnv['e1'] = { r1: { joinId: 'm1', concurrencyToken: 't' } }

    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.text()).toContain('Remove from environment')
  })
})
