namespace Web.Configuration;

public static class RateLimitPolicies
{
    public const string Api = "api";

    // Dedicated policy for the unauthenticated public read surface (/api/v1/public/wheels/{id}).
    // Stricter than Api and partitioned per client IP, since it has no per-user accounting.
    public const string PublicApi = "public-api";
}
