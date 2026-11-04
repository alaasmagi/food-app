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

export interface Bounds {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}

// Matches backend DTO/Web/RestaurantPageDto.cs.
export interface RestaurantPage {
  items: Restaurant[]
  total: number
  page: number
  pageSize: number
}

// Matches backend DTO/Messaging/OfferLine.cs; offerPrice is a display string (e.g. "4.90 EUR"), not a number.
export interface DailyOffer {
  offerText: string
  offerPrice: string | null
}
