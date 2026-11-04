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

export function reconcileSelection(
  selectedId: string | null,
  environments: DiningEnvironment[],
): string | null {
  if (selectedId == null) return null;
  return environments.some((e) => e.id === selectedId) ? selectedId : null;
}

export function filterRestaurantsByEnvironment(
  restaurants: Restaurant[],
  selectedId: string | null,
  membership: MembershipMap,
): Restaurant[] {
  if (selectedId == null) return restaurants;
  return restaurants.filter((r) => membership[r.id] != null);
}

/** Restaurants filtered client-side to the selected environment, shared by Dashboard and Map. */
export function useEnvironmentFilteredRestaurants() {
  const query = useRestaurants();
  const { data: environments } = useEnvironments();
  const selectedEnvironmentId = useEnvironmentStore((s) => s.selectedEnvironmentId);
  const setSelectedEnvironmentId = useEnvironmentStore((s) => s.setSelectedEnvironmentId);
  const membership = useEnvironmentMembership(selectedEnvironmentId);

  // The selected environment may have been deleted; fall back to "All".
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
