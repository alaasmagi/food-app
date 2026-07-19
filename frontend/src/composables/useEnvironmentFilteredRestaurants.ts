import { computed, type ComputedRef, type Ref } from 'vue'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import type { Restaurant } from '../types/restaurant'

/**
 * The restaurant set narrowed to the currently selected environment.
 *
 * Under "All" (`selectedEnvironmentId === null`) this returns the given `allSource` — the caller
 * picks which "All" set to show, because the Map and List views differ: the map passes the viewport
 * set (`areaList`) while the list passes the paged/searchable set (`pagedList`). Under a specific
 * environment it is that environment's members only, derived client-side from the fully-loaded
 * catalog and membership index (curated sets stay complete regardless of viewport or search).
 * DashboardView triggers the right load (`loadInBounds`/`loadPage` under "All", `loadRestaurants`
 * under an environment).
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
