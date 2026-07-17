using Web.Configuration;

namespace Tests;

public class RateLimitOptionsTests
{
    [Fact]
    public void PublicPolicy_IsStricterThanAuthenticatedPolicy()
    {
        var authenticated = RequiredConfiguration.ApiRateLimitOptions();
        var publicPolicy = RequiredConfiguration.PublicApiRateLimitOptions();

        // Compare normalized permits-per-second so the assertion holds even if the windows differ.
        var authenticatedRate = (double)authenticated.PermitLimit / authenticated.WindowSeconds;
        var publicRate = (double)publicPolicy.PermitLimit / publicPolicy.WindowSeconds;

        Assert.True(
            publicRate < authenticatedRate,
            $"Public rate {publicRate}/s must be stricter than authenticated {authenticatedRate}/s.");
    }
}
