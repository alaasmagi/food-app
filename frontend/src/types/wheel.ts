// Matches backend DTO/Web/UserWheelDto.cs (BaseEntityWithConcurrency + fields).
// restaurantNames is a frozen snapshot of restaurant names (not ids), per the backend rule.
export interface UserWheel {
  id: string
  concurrencyToken: string
  name: string
  restaurantNames: string[]
  isPublic: boolean
}

// Minimal public projection returned by GET /api/v1/public/wheels/{id}.
// Intentionally omits concurrencyToken and isPublic: the public endpoint exposes
// only what a logged-out shared-wheel view needs to render.
export interface PublicWheel {
  id: string
  name: string
  restaurantNames: string[]
}
