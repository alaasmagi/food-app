using Base.Contracts.Application;
using Base.Contracts.Domain;
using Base.Contracts.DTO;
using Base.Domain;
using Contracts.Application;
using Domain;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

/// <summary>
/// Base for admin controllers over user-owned entities. Listing uses the empty actor (returns every
/// owner's rows); per-row operations act as the row's owner so the service's ownership checks pass; and
/// creates stamp ownership from an owner picked on the form.
/// </summary>
public abstract class UserScopedAdminController<TDto, TDomain> : AdminCrudController<TDto, TDomain>
    where TDto : BaseEntityWithConcurrency, new()
    where TDomain : class, IBaseEntity<Guid>
{
    private readonly IAppUserService _appUserService;

    protected UserScopedAdminController(
        IBaseService<TDomain, Guid, Guid> service,
        IMapper<TDto, TDomain> mapper,
        IAppUserService appUserService)
        : base(service, mapper)
    {
        _appUserService = appUserService;
    }

    protected override Task<Guid> ResolveRowActorAsync(Guid id) => OwnerFromListAsync(id);

    protected override Task<Guid> ResolveCreateActorAsync(TDto dto) => Task.FromResult(FormOwnerId());

    /// <summary>Loads the owner (AppUser) picker used on create forms into ViewData["Owners"].</summary>
    protected async Task PopulateOwnersAsync()
    {
        var users = await _appUserService.GetAllAsync(Guid.Empty);
        ViewData["Owners"] = new SelectList(
            (users.Value ?? Enumerable.Empty<AppUser>())
                .Select(u => new { u.Id, Display = $"{u.Username} ({u.Email})" }),
            "Id",
            "Display");
    }
}
