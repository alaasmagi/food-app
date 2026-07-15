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

// One offer line from GET /api/v1/restaurants/{id}/offers, which returns a bare
// JSON array of these (matches backend DTO/Messaging/OfferLine.cs). There is no
// BusinessDate in the response - it is cached server-side only. offerPrice is a
// display string (e.g. "4.90 EUR"), not a number, and may be null.
export interface DailyOffer {
  offerText: string
  offerPrice: string | null
}
