/** Type mirroring the backend AppUserDto; a null `notificationEnvironmentId` means all restaurants. */
export interface AppUser {
  id: string;
  // Not round-tripped by the notification-preferences PATCH.
  concurrencyToken: string;
  email: string;
  username: string;
  fullName: string;
  locale: string;
  sendNotifications: boolean;
  notificationEnvironmentId: string | null;
}
