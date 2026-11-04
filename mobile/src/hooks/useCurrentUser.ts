import { useQuery } from '@tanstack/react-query';

import { getCurrentUser } from '@/api/account';
import type { AppUser } from '@/types/appUser';

export const currentUserQueryKey = ['current-user'] as const;

export function useCurrentUser() {
  return useQuery<AppUser>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  });
}
