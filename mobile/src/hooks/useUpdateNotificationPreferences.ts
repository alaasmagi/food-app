import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNotificationPreferences } from '@/api/account';
import { currentUserQueryKey } from '@/hooks/useCurrentUser';

export interface NotificationPreferencesVars {
  sendNotifications: boolean;
  notificationEnvironmentId: string | null;
}

/**
 * Updates the current user's notification preferences. The PATCH returns the
 * full updated AppUser, so on success we write it straight into the current-user
 * cache (rather than invalidating + refetching) — the Settings screen then
 * reflects the saved state immediately.
 */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: NotificationPreferencesVars) =>
      updateNotificationPreferences(vars.sendNotifications, vars.notificationEnvironmentId),
    onSuccess: (updated) => qc.setQueryData(currentUserQueryKey, updated),
  });
}
