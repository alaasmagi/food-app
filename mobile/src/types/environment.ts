/**
 * Hand-written types matching the backend Web DTOs (camelCase JSON), mirroring
 * the proven web frontend types. `DiningEnvironment` <- DiningEnvironmentDto,
 * `EnvironmentRestaurant` <- EnvironmentRestaurantDto. Membership is a
 * first-class join row: a restaurant is added/removed by creating/deleting one
 * of these, keyed by its own id, with its own concurrency token.
 */

export interface DiningEnvironment {
  id: string;
  /** Optimistic-concurrency token; round-tripped as If-Match on update/delete. */
  concurrencyToken: string;
  name: string;
  description: string | null;
}

export interface EnvironmentRestaurant {
  id: string;
  /** Concurrency token for the join row; round-tripped as If-Match on delete. */
  concurrencyToken: string;
  environmentId: string;
  restaurantId: string;
}
