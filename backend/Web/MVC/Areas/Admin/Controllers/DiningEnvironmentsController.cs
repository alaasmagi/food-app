using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class DiningEnvironmentsController : UserScopedAdminController<DiningEnvironmentDto, DiningEnvironment>
{
    public DiningEnvironmentsController(
        IDiningEnvironmentService service,
        IMapper<DiningEnvironmentDto, DiningEnvironment> mapper,
        IAppUserService appUserService)
        : base(service, mapper, appUserService)
    {
    }

    protected override string EntityName => "Dining environment";

    protected override Task PopulateEditorAsync(DiningEnvironmentDto? dto) => PopulateOwnersAsync();
}
