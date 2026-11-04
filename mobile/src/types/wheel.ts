/** Types mirroring the backend user-wheel Web DTOs. */
export interface UserWheel {
  id: string;
  // Sent back as If-Match on update/delete.
  concurrencyToken: string;
  name: string;
  restaurantNames: string[];
  isPublic: boolean;
}

export interface PublicWheel {
  name: string;
  restaurantNames: string[];
}
