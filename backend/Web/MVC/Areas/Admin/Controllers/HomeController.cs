using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;

namespace Web.MVC.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public sealed class HomeController : Controller
{
    public IActionResult Index() => View();
}
