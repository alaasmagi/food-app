/**
 * Hand-written type matching the backend Web DTO (camelCase JSON), mirroring the
 * proven web frontend type. `Favourite` <- FavouriteDto. `rating` is an integer
 * 1-5 ([Range(1,5)] server-side); `note` is nullable (max 1024 chars server-side).
 */
export interface Favourite {
  id: string;
  /** Optimistic-concurrency token; round-tripped as If-Match on explicit update. */
  concurrencyToken: string;
  restaurantId: string;
  rating: number;
  note: string | null;
}
