using Base.Contracts.Application;
using Base.Contracts.Domain;
using Base.Contracts.DTO;
using Base.Domain;
using Base.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Web.Configuration;

namespace Web.MVC.Areas.Admin.Controllers;

/// <summary>
/// Shared CRUD scaffolding for the admin console. Each entity gets a thin subclass that supplies its
/// concrete service + Web DTO mapper and (optionally) overrides the actor-resolution and dropdown hooks.
/// The controllers reuse the existing application services, so all domain rules (validation, concurrency,
/// ownership) stay in one place.
/// </summary>
[Area("Admin")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public abstract class AdminCrudController<TDto, TDomain> : Controller
    where TDto : BaseEntityWithConcurrency, new()
    where TDomain : class, IBaseEntity<Guid>
{
    protected readonly IBaseService<TDomain, Guid, Guid> Service;
    protected readonly IMapper<TDto, TDomain> Mapper;

    protected AdminCrudController(IBaseService<TDomain, Guid, Guid> service, IMapper<TDto, TDomain> mapper)
    {
        Service = service;
        Mapper = mapper;
    }

    /// <summary>Human-readable singular name used in headings, links and flash messages.</summary>
    protected abstract string EntityName { get; }

    /// <summary>Join rows (EnvironmentRestaurant) are create/delete only; set false to hide/deny editing.</summary>
    protected virtual bool SupportsEdit => true;

    /// <summary>True when the domain entity is user-owned and a create needs an owner actor.</summary>
    protected bool RequiresOwner => typeof(IBaseEntityUserId<Guid>).IsAssignableFrom(typeof(TDomain));

    // Non-scoped entities use the empty actor (no ownership filter). User-scoped entities override these
    // to act as the row's owner (edit/delete/details) or the selected owner (create).
    protected virtual Task<Guid> ResolveListActorAsync() => Task.FromResult(Guid.Empty);
    protected virtual Task<Guid> ResolveRowActorAsync(Guid id) => Task.FromResult(Guid.Empty);
    protected virtual Task<Guid> ResolveCreateActorAsync(TDto dto) => Task.FromResult(Guid.Empty);

    /// <summary>Hook to load FK/enum dropdowns into ViewData before a form renders.</summary>
    protected virtual Task PopulateEditorAsync(TDto? dto) => Task.CompletedTask;

    [HttpGet]
    public virtual async Task<IActionResult> Index()
    {
        var actor = await ResolveListActorAsync();
        var result = await Service.GetAllAsync(actor);
        if (!result.Successful)
        {
            TempData["AdminError"] = FriendlyError(result.Error);
            return View(new List<TDto>());
        }

        var dtos = Mapper.Map(result.Value ?? Enumerable.Empty<TDomain>())?.ToList() ?? new List<TDto>();
        return View(dtos);
    }

    [HttpGet]
    public virtual async Task<IActionResult> Details(Guid id)
    {
        var dto = await FindDtoAsync(id);
        return dto == null ? NotFound() : View(dto);
    }

    [HttpGet]
    public virtual async Task<IActionResult> Create()
    {
        await PopulateEditorAsync(null);
        return View(new TDto());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public virtual async Task<IActionResult> Create(TDto dto)
    {
        var actor = await ResolveCreateActorAsync(dto);
        if (RequiresOwner && actor == Guid.Empty)
        {
            ModelState.AddModelError(string.Empty, "Please select an owner for the new record.");
        }

        if (!ModelState.IsValid)
        {
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        var domain = Mapper.Map(dto);
        if (domain == null)
        {
            ModelState.AddModelError(string.Empty, "Invalid payload.");
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        var result = await Service.CreateAsync(domain, actor);
        if (!result.Successful)
        {
            ModelState.AddModelError(string.Empty, FriendlyError(result.Error));
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        TempData["AdminSuccess"] = $"{EntityName} created.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public virtual async Task<IActionResult> Edit(Guid id)
    {
        if (!SupportsEdit)
        {
            return NotFound();
        }

        var dto = await FindDtoAsync(id);
        if (dto == null)
        {
            return NotFound();
        }

        await PopulateEditorAsync(dto);
        return View(dto);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public virtual async Task<IActionResult> Edit(Guid id, TDto dto)
    {
        if (!SupportsEdit)
        {
            return NotFound();
        }

        if (!ModelState.IsValid)
        {
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        var domain = Mapper.Map(dto);
        if (domain == null)
        {
            ModelState.AddModelError(string.Empty, "Invalid payload.");
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        var actor = await ResolveRowActorAsync(id);
        var result = await Service.UpdateAsync(id, domain, NormalizeToken(dto.ConcurrencyToken), actor);
        if (!result.Successful)
        {
            ModelState.AddModelError(string.Empty, FriendlyError(result.Error));
            await PopulateEditorAsync(dto);
            return View(dto);
        }

        TempData["AdminSuccess"] = $"{EntityName} updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public virtual async Task<IActionResult> Delete(Guid id)
    {
        var dto = await FindDtoAsync(id);
        return dto == null ? NotFound() : View(dto);
    }

    [HttpPost]
    [ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public virtual async Task<IActionResult> DeleteConfirmed(Guid id, string? concurrencyToken)
    {
        var actor = await ResolveRowActorAsync(id);
        var result = await Service.RemoveAsync(id, NormalizeToken(concurrencyToken), actor);
        TempData[result.Successful ? "AdminSuccess" : "AdminError"] =
            result.Successful ? $"{EntityName} deleted." : FriendlyError(result.Error);
        return RedirectToAction(nameof(Index));
    }

    /// <summary>
    /// Loads a single row as a DTO. For user-scoped entities <see cref="Service"/>.GetByIdAsync enforces
    /// ownership, so the owner actor is resolved first (subclasses read it from the unscoped list).
    /// </summary>
    protected async Task<TDto?> FindDtoAsync(Guid id)
    {
        var actor = await ResolveRowActorAsync(id);
        var result = await Service.GetByIdAsync(id, actor);
        if (!result.Successful || result.Value == null)
        {
            return null;
        }

        return Mapper.Map(result.Value);
    }

    /// <summary>Resolve a user-scoped row's owner id via the unscoped list (empty actor bypasses filtering).</summary>
    protected async Task<Guid> OwnerFromListAsync(Guid id)
    {
        var all = await Service.GetAllAsync(Guid.Empty);
        var row = all.Value?.FirstOrDefault(e => e.Id == id);
        return row is IBaseEntityUserId<Guid> owner ? owner.UserId : Guid.Empty;
    }

    /// <summary>Owner id chosen on a create form (posted as the "OwnerId" field).</summary>
    protected Guid FormOwnerId() =>
        Guid.TryParse(Request.Form["OwnerId"], out var ownerId) ? ownerId : Guid.Empty;

    protected static string? NormalizeToken(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().Trim('"');

    protected static string FriendlyError(IError? error) => error?.Code switch
    {
        ErrorDefaults.Codes.NotFound => "Record not found.",
        ErrorDefaults.Codes.Forbidden => "You are not allowed to modify this record.",
        ErrorDefaults.Codes.ConcurrencyConflict => "This record was changed by someone else. Reload and try again.",
        ErrorDefaults.Codes.ConcurrencyTokenRequired => "Missing concurrency token. Reload and try again.",
        _ => error?.Message ?? "The operation failed."
    };
}
