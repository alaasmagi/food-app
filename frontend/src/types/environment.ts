// Matches backend DTO/Web/DiningEnvironmentDto.cs (BaseEntityWithConcurrency + fields).
export interface DiningEnvironment {
  id: string
  concurrencyToken: string
  name: string
  description: string | null
  // The saved auto-fill origin (a map point plus radius) the backend uses to import nearby
  // restaurants. All null when unset. The backend's PascalCase AutoFill* properties serialize to
  // these camelCase names, matching the rest of this DTO. Radius is null when unset; the backend
  // applies its 500 m default only at auto-fill time, never persisting it.
  autoFillLatitude: number | null
  autoFillLongitude: number | null
  autoFillRadiusMeters: number | null
}

// Matches backend DTO/Web/EnvironmentRestaurantDto.cs. A first-class join row:
// membership is added/removed by creating/deleting one of these, keyed by its own id.
export interface EnvironmentRestaurant {
  id: string
  concurrencyToken: string
  environmentId: string
  restaurantId: string
}
