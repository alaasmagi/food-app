using Web.Configuration;

namespace Tests;

public class FrontendOriginProviderTests
{
    private static FrontendOriginProvider Provider() => new("https://app.example.com");

    [Fact]
    public void IsAllowedReturnUrl_LocalUrl_Allowed()
    {
        // The caller (controller) determines locality via Url.IsLocalUrl and passes it in.
        Assert.True(Provider().IsAllowedReturnUrl("/dashboard", isLocalUrl: true));
    }

    [Fact]
    public void IsAllowedReturnUrl_ExactFrontendOrigin_Allowed()
    {
        Assert.True(Provider().IsAllowedReturnUrl("https://app.example.com/some/path?q=1", isLocalUrl: false));
    }

    [Theory]
    [InlineData("https://evil.com/phish")]                  // unrelated origin
    [InlineData("https://app.example.com.evil.com/phish")]  // prefix look-alike host
    [InlineData("http://app.example.com/insecure")]         // scheme mismatch
    [InlineData("https://app.example.com:8443/other-port")] // port mismatch
    [InlineData("not-a-url")]                               // unparseable
    [InlineData("")]                                        // empty
    [InlineData(null)]                                      // missing
    public void IsAllowedReturnUrl_ForeignOrGarbage_Rejected(string? returnUrl)
    {
        Assert.False(Provider().IsAllowedReturnUrl(returnUrl, isLocalUrl: false));
    }

    [Fact]
    public void Origin_NormalizesToAuthority()
    {
        Assert.Equal("https://app.example.com", Provider().Origin);
    }

    [Fact]
    public void Constructor_NonAbsoluteOrigin_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => new FrontendOriginProvider("app.example.com"));
    }
}
