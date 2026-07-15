namespace DTO.Web;

// Response of the cookie-authorized token-exchange endpoint: the frontend uses accessToken as a
// bearer token against the Web API until expiresAtUtc.
public class TokenResponseDto
{
    public string AccessToken { get; set; } = default!;

    public DateTimeOffset ExpiresAtUtc { get; set; }
}
