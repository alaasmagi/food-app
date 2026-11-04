// Matches backend DTO/Web/DiningEnvironmentDto.cs (BaseEntityWithConcurrency + fields).
export interface DiningEnvironment {
  id: string
  concurrencyToken: string
  name: string
  description: string | null
  // Saved auto-fill origin; a null radius means the backend applies its 500 m default at auto-fill time.
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
