import { useEffect, useMemo } from 'react';

import { useRestaurants } from '@/hooks/useRestaurants';
import { useEnvironments } from '@/hooks/useEnvironments';
import {
  useEnvironmentMembership,
  type MembershipMap,
} from '@/hooks/useEnvironmentRestaurants';
import { useEnvironmentStore } from '@/stores/environmentStore';
import type { DiningEnvironment } from '@/types/environment';
import type { Restaurant } from '@/types/restaurant';

/**
 * Returns `null` when the current selection is still valid, or the corrected
 * selection (always `null` here) when the selected environment no longer exists
 * — e.g. it was just deleted. Kept pure so it can be tested without a store.
 */
export function reconcileSelection(
  selectedId: string | null,
  environments: DiningEnvironment[],
): string | null {
  if (selectedId == null) return null;
  return environments.some((e) => e.id === selectedId) ? selectedId : null;
}

/** Narrows the catalog to the selected environment's members; "All" passes through. */
export function filterRestaurantsByEnvironment(
  restaurants: Restaurant[],
  selectedId: string | null,
  membership: MembershipMap,
): Restaurant[] {
  if (selectedId == null) return restaurants;
  return restaurants.filter((r) => membership[r.id] != null);
}

/**
 * Shared source of truth for both the Dashboard and the Map: the restaurants
 * query, the selected environment, its membership map, and the client-side
 * filtered restaurant list. Filtering is derived from already-cached data, so
 * switching environments issues no new restaurants request. If the selected
 * environment disappears (e.g. deleted), the selection falls back to "All".
 */
export function useEnvironmentFilteredRestaurants() {
  const query = useRestaurants();
  const { data: environments } = useEnvironments();
  const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId);
  const setSelectedEnvironmentId = useEnvironmentStore((s) => s.setSelectedEnvironmentId);
  const membership = useEnvironmentMembership(selectedEnvironmentId);

  // Fall back to "All" when the selected environment no longer exists.
  useEffect(() => {
    if (environments === undefined) return;
    const resolved = reconcileSelection(selectedEnvironmentId, environments);
    if (resolved !== selectedEnvironmentId) {
      setSelectedEnvironmentId(resolved);
    }
  }, [environments, selectedEnvironmentId, setSelectedEnvironmentId]);

  const restaurants = useMemo(
    () => filterRestaurantsByEnvironment(query.data ?? [], selectedEnvironmentId, membership),
    [query.data, selectedEnvironmentId, membership],
  );

  return { query, restaurants, membership, selectedEnvironmentId };
}
