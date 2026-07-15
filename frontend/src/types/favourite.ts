// Matches backend DTO/Web/FavouriteDto.cs (BaseEntityWithConcurrency + fields).
// rating is an integer 1-5 ([Range(1,5)] server-side); note is nullable (max 1024).
export interface Favourite {
  id: string
  concurrencyToken: string
  restaurantId: string
  rating: number
  note: string | null
}
