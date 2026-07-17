using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;

namespace Web.MVC.Controllers;

public class AccountController(FrontendOriginProvider frontendOriginProvider) : Controller
{
    [AllowAnonymous]
    public IActionResult Login(string? returnUrl = null)
    {
        return Challenge(
            new AuthenticationProperties
            {
                RedirectUri = ResolveRedirectUri(returnUrl)
            },
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    // GET so the SPA can trigger sign-out via a full-page redirect, mirroring Login. A cross-origin
    // SPA navigation cannot carry the MVC antiforgery token, so it is not required here; the endpoint
    // only ends the caller's own session and redirects to a validated return url.
    [Authorize]
    [HttpGet]
    [HttpPost]
    public IActionResult Logout(string? returnUrl = null)
    {
        return SignOut(
            new AuthenticationProperties
            {
                RedirectUri = ResolveRedirectUri(returnUrl)
            },
            CookieAuthenticationDefaults.AuthenticationScheme,
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    // Honor the return url only when it is a local url or exactly the configured frontend origin,
    // otherwise fall back to the safe local default (open-redirect guard).
    private string ResolveRedirectUri(string? returnUrl)
    {
        return frontendOriginProvider.IsAllowedReturnUrl(returnUrl, Url.IsLocalUrl(returnUrl))
            ? returnUrl!
            : Url.Action("Index", "Home")!;
    }

    [AllowAnonymous]
    public IActionResult AccessDenied()
    {
        return View();
    }
}
