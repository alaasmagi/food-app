namespace Web.Configuration;

// Single source of the configured frontend origin, shared by the CORS policy and the login/logout
// return-url validation so the two can never diverge. Kept IUrlHelper-free so return-url validation
// is unit-testable without an HTTP context - the caller supplies whether the url is a local url.
public sealed class FrontendOriginProvider
{
    private readonly Uri _frontendOrigin;

    public FrontendOriginProvider(string frontendOrigin)
    {
        if (!Uri.TryCreate(frontendOrigin, UriKind.Absolute, out var parsed) ||
            (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException(
                $"FRONTEND_ORIGIN must be an absolute http(s) url, for example https://app.example.com. Got: {frontendOrigin}");
        }

        _frontendOrigin = parsed;
    }

    // The scheme://host[:port] origin, normalized (default ports omitted) for the CORS allow-list.
    public string Origin => _frontendOrigin.GetLeftPart(UriPartial.Authority);

    // A return url is allowed when the caller determined it is a local url, or when it is an absolute
    // http(s) url whose origin (scheme + host + port) exactly equals the configured frontend origin.
    // Origin components are compared explicitly - never a string prefix, which would let
    // https://app.example.com.evil.com slip through.
    public bool IsAllowedReturnUrl(string? returnUrl, bool isLocalUrl)
    {
        if (isLocalUrl)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(returnUrl) ||
            !Uri.TryCreate(returnUrl, UriKind.Absolute, out var candidate))
        {
            return false;
        }

        return (candidate.Scheme == Uri.UriSchemeHttp || candidate.Scheme == Uri.UriSchemeHttps) &&
               string.Equals(candidate.Scheme, _frontendOrigin.Scheme, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(candidate.Host, _frontendOrigin.Host, StringComparison.OrdinalIgnoreCase) &&
               candidate.Port == _frontendOrigin.Port;
    }
}
