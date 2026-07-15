// Matches backend DTO/Web/TokenResponseDto.cs.
// Response of the cookie-authorized token-exchange endpoint; the frontend uses
// accessToken as a bearer token until expiresAtUtc.
export interface TokenResponse {
  accessToken: string
  /** ISO 8601 timestamp (serialized DateTimeOffset). */
  expiresAtUtc: string
}
