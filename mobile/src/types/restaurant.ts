/** Types mirroring the backend restaurant Web DTOs; errors arrive as RFC 7807 ProblemDetails. */

export interface Restaurant {
  id: string;
  concurrencyToken: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  offerTimeText: string;
  parkingInfo: string;
  openingInfo: string;
  // Static hint that the restaurant publishes offers at all, not a "today" flag.
  hasOffers: boolean;
  isFastFood: boolean;
  offersResourceUrl: string | null;
  offerProviderId: string | null;
}

export interface Offer {
  offerText: string;
  // Display string such as "4.90 EUR"; never parse as a number.
  offerPrice: string | null;
}

export interface ProblemDetails {
  title: string;
  detail: string;
  status: number;
}
