/**
 * Hand-written type matching the backend Web DTO (camelCase JSON), mirroring the
 * proven web frontend type. `AppUser` <- AppUserDto. The app only ever talks to
 * the Web DTO shape, never backend Domain entities. `notificationEnvironmentId`
 * is null when the daily email covers all restaurants rather than one environment.
 */
export interface AppUser {
  id: string;
  /** Concurrency token (not round-tripped by the notification-preferences PATCH). */
  concurrencyToken: string;
  email: string;
  username: string;
  fullName: string;
  locale: string;
  sendNotifications: boolean;
  notificationEnvironmentId: string | null;
}
