using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Web.Configuration;
using Web.MVC.Controllers;

namespace Tests;

public class AccountControllerTests
{
    private const string FrontendOrigin = "https://app.example.com";

    [Theory]
    [InlineData("/dashboard", "/dashboard")]                                                // local
    [InlineData("https://app.example.com/dashboard", "https://app.example.com/dashboard")]  // frontend origin
    [InlineData("https://evil.com/phish", "/")]                                             // foreign -> fallback
    [InlineData(null, "/")]                                                                 // none -> fallback
    public void Login_RedirectsToValidatedReturnUrl(string? returnUrl, string expected)
    {
        var controller = CreateController();

        var result = Assert.IsType<ChallengeResult>(controller.Login(returnUrl));

        Assert.Equal(expected, result.Properties!.RedirectUri);
    }

    [Theory]
    [InlineData("/settings", "/settings")]                                                  // local
    [InlineData("https://app.example.com/settings", "https://app.example.com/settings")]    // frontend origin
    [InlineData("https://evil.com", "/")]                                                   // foreign -> fallback
    [InlineData(null, "/")]                                                                 // none -> fallback
    public void Logout_RedirectsToValidatedReturnUrl(string? returnUrl, string expected)
    {
        var controller = CreateController();

        var result = Assert.IsType<SignOutResult>(controller.Logout(returnUrl));

        Assert.Equal(expected, result.Properties!.RedirectUri);
    }

    private static AccountController CreateController()
    {
        return new AccountController(new FrontendOriginProvider(FrontendOrigin))
        {
            Url = new FakeUrlHelper()
        };
    }

    // Minimal IUrlHelper: IsLocalUrl mirrors ASP.NET's rule (leading '/', not '//' or '/\'), and
    // Action(...) stands in for Url.Action("Index", "Home") returning the app root.
    private sealed class FakeUrlHelper : IUrlHelper
    {
        public ActionContext ActionContext { get; } = new();

        public string? Action(UrlActionContext actionContext) => "/";

        public string? Content(string? contentPath) => contentPath;

        public bool IsLocalUrl(string? url) =>
            !string.IsNullOrEmpty(url) && url[0] == '/' && (url.Length == 1 || (url[1] != '/' && url[1] != '\\'));

        public string? Link(string? routeName, object? values) => null;

        public string? RouteUrl(UrlRouteContext routeContext) => null;
    }
}
