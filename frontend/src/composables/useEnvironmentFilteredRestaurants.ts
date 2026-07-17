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
 * fetch. Used to drive the map view. The list view intentionally does NOT use
 * this — it always shows the full catalog because it doubles as the
 * membership-management UI (see DashboardView).
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
