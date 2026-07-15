// Matches backend DTO/Web/DiningEnvironmentDto.cs (BaseEntityWithConcurrency + fields).
export interface DiningEnvironment {
  id: string
  concurrencyToken: string
  name: string
  description: string | null
}

// Matches backend DTO/Web/EnvironmentRestaurantDto.cs. A first-class join row:
// membership is added/removed by creating/deleting one of these, keyed by its own id.
export interface EnvironmentRestaurant {
  id: string
  concurrencyToken: string
  environmentId: string
  restaurantId: string
}
