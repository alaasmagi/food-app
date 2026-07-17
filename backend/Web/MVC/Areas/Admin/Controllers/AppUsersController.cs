using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class AppUsersController : AdminCrudController<AppUserDto, AppUser>
{
    private readonly IDiningEnvironmentService _diningEnvironmentService;

    public AppUsersController(
        IAppUserService service,
        IMapper<AppUserDto, AppUser> mapper,
        IDiningEnvironmentService diningEnvironmentService)
        : base(service, mapper)
    {
        _diningEnvironmentService = diningEnvironmentService;
    }

    protected override string EntityName => "User";

    protected override async Task PopulateEditorAsync(AppUserDto? dto)
    {
        // Dining environments are user-scoped; the empty actor returns every row for the picker.
        var environments = await _diningEnvironmentService.GetAllAsync(Guid.Empty);
        ViewData["Environments"] = new SelectList(
            environments.Value ?? Enumerable.Empty<DiningEnvironment>(),
            nameof(DiningEnvironment.Id),
            nameof(DiningEnvironment.Name),
            dto?.NotificationEnvironmentId);
    }
}
