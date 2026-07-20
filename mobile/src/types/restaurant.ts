/**
 * Hand-written types matching the backend Web DTOs (camelCase JSON). Fields and
 * nullability mirror the backend exactly and match the proven Vue frontend
 * types. The API returns bare payloads on success and RFC 7807 ProblemDetails
 * on error — there is no IMethodResponse wrapper on the wire.
 */

export interface Restaurant {
  id: string;
  /** Optimistic-concurrency token; round-tripped on future mutations. */
  concurrencyToken: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  offerTimeText: string;
  parkingInfo: string;
  openingInfo: string;
  /** Static hint that this restaurant does offers at all (not a "today" flag). */
  hasOffers: boolean;
  isFastFood: boolean;
  offersResourceUrl: string | null;
  offerProviderId: string | null;
}

export interface Offer {
  offerText: string;
  /** Display string such as "4.90 EUR", or null. Never parse as a number. */
  offerPrice: string | null;
}

/** RFC 7807 error body returned by the backend on non-ok responses. */
export interface ProblemDetails {
  title: string;
  detail: string;
  status: number;
}
