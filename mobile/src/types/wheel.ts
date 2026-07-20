/**
 * Hand-written types matching the backend Web DTOs (camelCase JSON), mirroring
 * the proven web frontend types.
 *
 * `UserWheel` <- UserWheelDto. `restaurantNames` is a frozen snapshot of
 * restaurant NAME strings (not ids), per the backend rule, so a wheel keeps
 * working even if the catalog changes later.
 *
 * `PublicWheel` <- PublicUserWheelDto: the deliberately minimal public
 * projection returned by GET /api/v1/public/wheels/{id}. It carries only the
 * display name and frozen name snapshot — no id, concurrencyToken, or isPublic.
 */
export interface UserWheel {
  id: string;
  /** Optimistic-concurrency token; round-tripped as If-Match on update/delete. */
  concurrencyToken: string;
  name: string;
  restaurantNames: string[];
  isPublic: boolean;
}

export interface PublicWheel {
  name: string;
  restaurantNames: string[];
}
