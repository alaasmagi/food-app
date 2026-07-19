import { computed, type ComputedRef } from 'vue'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import type { Restaurant } from '../types/restaurant'

/**
 * The restaurant set narrowed to the currently selected environment.
 *
 * Under "All" (`selectedEnvironmentId === null`) this is the current **map viewport** set
 * (`areaList`), fetched by bounding box as the user pans/zooms — so the dashboard never loads the
 * whole catalog just to browse. Under a specific environment it is that environment's members only,
 * derived client-side from the fully-loaded catalog and membership index (curated sets stay
 * complete regardless of the viewport). DashboardView is responsible for triggering the right load
 * (`loadInBounds` under "All", `loadRestaurants` under an environment). Adding restaurants to an
 * environment is a separate, explicit flow (the "Add restaurants" picker in DashboardView).
 */
export function useEnvironmentFilteredRestaurants(): ComputedRef<Restaurant[]> {
  const restaurants = useRestaurantsStore()
  const environments = useEnvironmentsStore()

  return computed(() => {
    const envId = environments.selectedEnvironmentId
    if (!envId) return restaurants.areaList
    const members = environments.membershipByEnv[envId]
    if (!members) return []
    return restaurants.list.filter((restaurant) => Boolean(members[restaurant.id]))
  })
}
