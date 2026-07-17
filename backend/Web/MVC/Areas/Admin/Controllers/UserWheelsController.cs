using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class UserWheelsController : UserScopedAdminController<UserWheelDto, UserWheel>
{
    public UserWheelsController(
        IUserWheelService service,
        IMapper<UserWheelDto, UserWheel> mapper,
        IAppUserService appUserService)
        : base(service, mapper, appUserService)
    {
    }

    protected override string EntityName => "User wheel";

    protected override Task PopulateEditorAsync(UserWheelDto? dto) => PopulateOwnersAsync();

    // RestaurantNames is a free-form string list; the form edits it as one-name-per-line text, so parse
    // it into the DTO before the shared create/edit logic runs.
    [HttpPost]
    [ValidateAntiForgeryToken]
    public override Task<IActionResult> Create(UserWheelDto dto)
    {
        dto.RestaurantNames = ParseRestaurantNames();
        return base.Create(dto);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public override Task<IActionResult> Edit(Guid id, UserWheelDto dto)
    {
        dto.RestaurantNames = ParseRestaurantNames();
        return base.Edit(id, dto);
    }

    private List<string> ParseRestaurantNames() =>
        Request.Form["RestaurantNamesText"].ToString()
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
}
