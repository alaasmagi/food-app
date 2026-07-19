import { computed, type ComputedRef } from 'vue'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import type { Restaurant } from '../types/restaurant'

/**
 * The restaurant set narrowed to the currently selected environment.
 *
 * Under "All" (`selectedEnvironmentId === null`) this is the full catalog; under
 * a specific environment it is that environment's members only, derived
 * client-side from the already-loaded catalog and membership index with no extra
 * fetch. Drives both the list and map views: selecting an environment narrows
 * each to that environment's restaurants. Adding restaurants to an environment
 * is a separate, explicit flow (the "Add restaurants" picker in DashboardView).
 */
export function useEnvironmentFilteredRestaurants(): ComputedRef<Restaurant[]> {
  const restaurants = useRestaurantsStore()
  const environments = useEnvironmentsStore()

  return computed(() => {
    const envId = environments.selectedEnvironmentId
    if (!envId) return restaurants.list
    const members = environments.membershipByEnv[envId]
    if (!members) return []
    return restaurants.list.filter((restaurant) => Boolean(members[restaurant.id]))
  })
}
