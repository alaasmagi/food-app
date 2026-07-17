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

  it('returns the full catalog under "All"', () => {
    const restaurants = useRestaurantsStore()
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta')]

    const filtered = useEnvironmentFilteredRestaurants()

    // selectedEnvironmentId defaults to null ("All").
    expect(filtered.value.map((r) => r.id)).toEqual(['r1', 'r2'])
  })

  it('returns only the members of the selected environment', () => {
    const restaurants = useRestaurantsStore()
    const environments = useEnvironmentsStore()
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')]
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

    // Switching back to "All" restores the full catalog reactively.
    environments.selectEnvironment(null)
    expect(filtered.value.map((r) => r.id)).toEqual(['r1', 'r2', 'r3'])
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
