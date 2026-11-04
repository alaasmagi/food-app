import { computed, type ComputedRef, type Ref } from 'vue'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import type { Restaurant } from '../types/restaurant'

/**
 * Restaurants of the selected environment, or `allSource` under "All" (the map and list pass different sets).
 */
export function useEnvironmentFilteredRestaurants(
  allSource: Ref<Restaurant[]>,
): ComputedRef<Restaurant[]> {
  const restaurants = useRestaurantsStore()
  const environments = useEnvironmentsStore()

  return computed(() => {
    const envId = environments.selectedEnvironmentId
    if (!envId) return allSource.value
    const members = environments.membershipByEnv[envId]
    if (!members) return []
    return restaurants.list.filter((restaurant) => Boolean(members[restaurant.id]))
  })
}
