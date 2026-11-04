import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getEnvironmentRestaurants } from '@/api/environments';
import type { EnvironmentRestaurant } from '@/types/environment';

export const environmentRestaurantsQueryKey = ['environment-restaurants'] as const;

export interface MembershipEntry {
  joinId: string;
  concurrencyToken: string;
}

export type MembershipMap = Record<string, MembershipEntry>;

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

export function useEnvironmentRestaurants() {
  return useQuery<EnvironmentRestaurant[]>({
    queryKey: environmentRestaurantsQueryKey,
    queryFn: getEnvironmentRestaurants,
  });
}

export function useEnvironmentMembership(environmentId: string | null): MembershipMap {
  const { data } = useEnvironmentRestaurants();
  return useMemo(
    () => membershipMapForEnvironment(data ?? [], environmentId),
    [data, environmentId],
  );
}
