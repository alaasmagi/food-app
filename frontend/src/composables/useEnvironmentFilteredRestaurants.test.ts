import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEnvironmentFilteredRestaurants } from './useEnvironmentFilteredRestaurants'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
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

describe('useEnvironmentFilteredRestaurants', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('returns the current map viewport set under "All"', () => {
    const restaurants = useRestaurantsStore()
    // Under "All" the dashboard is viewport-scoped: the composable reflects areaList (the current
    // map bounds fetch), not the full in-memory catalog.
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')]
    restaurants.areaList = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')]

    const filtered = useEnvironmentFilteredRestaurants()

    // selectedEnvironmentId defaults to null ("All").
    expect(filtered.value.map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('returns only the members of the selected environment', () => {
    const restaurants = useRestaurantsStore()
    const environments = useEnvironmentsStore()
    // An environment filters the full catalog (curated sets stay complete regardless of viewport);
    // "All" reflects the viewport set. Seed both so the reactive switch is observable.
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')]
    restaurants.areaList = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')]
    // r1 and r3 belong to environment "e1"; r2 does not.
    environments.membershipByEnv = {
      e1: {
        r1: { joinId: 'm1', concurrencyToken: 't' },
        r3: { joinId: 'm3', concurrencyToken: 't' },
      },
    }

    const filtered = useEnvironmentFilteredRestaurants()

    environments.selectEnvironment('e1')
    expect(filtered.value.map((r) => r.id)).toEqual(['r1', 'r3'])

    // Switching back to "All" reactively returns to the viewport set.
    environments.selectEnvironment(null)
    expect(filtered.value.map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('returns an empty set for a selected environment with no members', () => {
    const restaurants = useRestaurantsStore()
    const environments = useEnvironmentsStore()
    restaurants.list = [restaurant('r1', 'Alpha')]

    const filtered = useEnvironmentFilteredRestaurants()

    environments.selectEnvironment('e1')
    expect(filtered.value).toEqual([])
  })
})
