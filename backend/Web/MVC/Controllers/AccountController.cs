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

    [Authorize]
    [HttpPost]
    [ValidateAntiForgeryToken]
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
