import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getEnvironmentRestaurants } from '@/api/environments';
import type { EnvironmentRestaurant } from '@/types/environment';

/** Query key for the current user's environment membership join rows. */
export const environmentRestaurantsQueryKey = ['environment-restaurants'] as const;

/** What a restaurant's membership in one environment needs for removal. */
export interface MembershipEntry {
  joinId: string;
  concurrencyToken: string;
}

/** `restaurantId -> { joinId, concurrencyToken }` for a single environment. */
export type MembershipMap = Record<string, MembershipEntry>;

/**
 * Derives, for one environment, the `restaurantId -> { joinId, concurrencyToken }`
 * map used both to filter the catalog and to drive each card's remove action.
 * `null`/unknown environment yields an empty map (nothing is a member of "All").
 */
export function membershipMapForEnvironment(
  memberships: EnvironmentRestaurant[],
  environmentId: string | null,
): MembershipMap {
  if (environmentId == null) return {};
  const map: MembershipMap = {};
  for (const m of memberships) {
    if (m.environmentId === environmentId) {
      map[m.restaurantId] = { joinId: m.id, concurrencyToken: m.concurrencyToken };
    }
  }
  return map;
}

/** Fetches and caches the current user's environment membership join rows. */
export function useEnvironmentRestaurants() {
  return useQuery<EnvironmentRestaurant[]>({
    queryKey: environmentRestaurantsQueryKey,
    queryFn: getEnvironmentRestaurants,
  });
}

/** The membership map for one environment, memoized off the cached join rows. */
export function useEnvironmentMembership(environmentId: string | null): MembershipMap {
  const { data } = useEnvironmentRestaurants();
  return useMemo(
    () => membershipMapForEnvironment(data ?? [], environmentId),
    [data, environmentId],
  );
}
