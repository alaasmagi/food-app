namespace Web.Configuration;

public static class CorsPolicies
{
    // Credentialed policy allowing exactly the configured frontend origin, applied to the
    // account endpoints so the frontend's XHR to /account/token can send the auth cookie.
    public const string Frontend = "frontend";
}
