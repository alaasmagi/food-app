import { useQuery } from '@tanstack/react-query';

import { getCurrentUser } from '@/api/account';
import type { AppUser } from '@/types/appUser';

/** Query key for the current authenticated user. */
export const currentUserQueryKey = ['current-user'] as const;

/** Fetches and caches the current authenticated user's AppUser. */
export function useCurrentUser() {
  return useQuery<AppUser>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  });
}
