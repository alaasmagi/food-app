/** Types mirroring the backend dining-environment Web DTOs; membership is its own join row. */

export interface DiningEnvironment {
  id: string;
  // Sent back as If-Match on update/delete.
  concurrencyToken: string;
  name: string;
  description: string | null;
  // Saved auto-fill origin, all null when unset; a null radius means the backend's 500 m default.
  autoFillLatitude: number | null;
  autoFillLongitude: number | null;
  autoFillRadiusMeters: number | null;
}

export interface EnvironmentRestaurant {
  id: string;
  // Sent back as If-Match on delete.
  concurrencyToken: string;
  environmentId: string;
  restaurantId: string;
}
