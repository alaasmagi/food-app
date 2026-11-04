import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNotificationPreferences } from '@/api/account';
import { currentUserQueryKey } from '@/hooks/useCurrentUser';

export interface NotificationPreferencesVars {
  sendNotifications: boolean;
  notificationEnvironmentId: string | null;
}

/** Updates notification preferences, writing the returned AppUser straight into the current-user cache. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: NotificationPreferencesVars) =>
      updateNotificationPreferences(vars.sendNotifications, vars.notificationEnvironmentId),
    onSuccess: (updated) => qc.setQueryData(currentUserQueryKey, updated),
  });
}
