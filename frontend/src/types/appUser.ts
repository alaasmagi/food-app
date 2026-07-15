// Matches backend DTO/Web/AppUserDto.cs (BaseEntityWithConcurrency + fields).
// The frontend only ever talks to the Web DTO shape, never backend Domain entities.
export interface AppUser {
  id: string
  /** Concurrency token round-tripped as If-Match on updates (unused in this change). */
  concurrencyToken: string
  email: string
  username: string
  fullName: string
  locale: string
  sendNotifications: boolean
  notificationEnvironmentId: string | null
}
