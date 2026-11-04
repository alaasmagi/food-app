// Matches backend DTO/Web/UserWheelDto.cs (BaseEntityWithConcurrency + fields).
// restaurantNames is a frozen snapshot of restaurant names (not ids), per the backend rule.
export interface UserWheel {
  id: string
  concurrencyToken: string
  name: string
  restaurantNames: string[]
  isPublic: boolean
}

// Public projection: omits concurrencyToken and isPublic, exposing only what a logged-out viewer needs.
export interface PublicWheel {
  id: string
  name: string
  restaurantNames: string[]
}
