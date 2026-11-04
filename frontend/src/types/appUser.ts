// Matches backend DTO/Web/AppUserDto.cs (BaseEntityWithConcurrency + fields).
export interface AppUser {
  id: string
  concurrencyToken: string
  email: string
  username: string
  fullName: string
  locale: string
  sendNotifications: boolean
  notificationEnvironmentId: string | null
}
