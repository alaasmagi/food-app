// Matches backend DTO/Web/UserWheelDto.cs (BaseEntityWithConcurrency + fields).
// restaurantNames is a frozen snapshot of restaurant names (not ids), per the backend rule.
export interface UserWheel {
  id: string
  concurrencyToken: string
  name: string
  restaurantNames: string[]
  isPublic: boolean
}
