/** Type mirroring the backend FavouriteDto; `rating` is an integer 1-5. */
export interface Favourite {
  id: string;
  // Sent back as If-Match on update.
  concurrencyToken: string;
  restaurantId: string;
  rating: number;
  note: string | null;
}
