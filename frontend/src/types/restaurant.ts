// Matches backend DTO/Web/RestaurantDto.cs (BaseEntityWithConcurrency + fields).
export interface Restaurant {
  id: string
  concurrencyToken: string
  name: string
  city: string
  latitude: number
  longitude: number
  offerTimeText: string
  parkingInfo: string
  openingInfo: string
  hasOffers: boolean
  isFastFood: boolean
  offersResourceUrl: string | null
  offerProviderId: string | null
}

// A map viewport as a geographic bounding box, sent to the backend to fetch only
// the restaurants a user is currently looking at (see getRestaurantsInBounds).
export interface Bounds {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

// One page of the searchable restaurant list (GET /api/v1/restaurants/page). Matches backend
// DTO/Web/RestaurantPageDto.cs: the items plus the total match count for pagination.
export interface RestaurantPage {
  items: Restaurant[]
  total: number
  page: number
  pageSize: number
}

// One offer line from GET /api/v1/restaurants/{id}/offers, which returns a bare
// JSON array of these (matches backend DTO/Messaging/OfferLine.cs). There is no
// BusinessDate in the response - it is cached server-side only. offerPrice is a
// display string (e.g. "4.90 EUR"), not a number, and may be null.
export interface DailyOffer {
  offerText: string
  offerPrice: string | null
}
