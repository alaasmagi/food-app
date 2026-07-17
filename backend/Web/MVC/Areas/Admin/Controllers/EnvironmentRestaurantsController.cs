using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class EnvironmentRestaurantsController
    : UserScopedAdminController<EnvironmentRestaurantDto, EnvironmentRestaurant>
{
    private readonly IDiningEnvironmentService _diningEnvironmentService;
    private readonly IRestaurantService _restaurantService;

    public EnvironmentRestaurantsController(
        IEnvironmentRestaurantService service,
        IMapper<EnvironmentRestaurantDto, EnvironmentRestaurant> mapper,
        IAppUserService appUserService,
        IDiningEnvironmentService diningEnvironmentService,
        IRestaurantService restaurantService)
        : base(service, mapper, appUserService)
    {
        _diningEnvironmentService = diningEnvironmentService;
        _restaurantService = restaurantService;
    }

    protected override string EntityName => "Environment–restaurant link";

    // The join row has no Update on its service/API; it is create/delete only.
    protected override bool SupportsEdit => false;

    protected override async Task PopulateEditorAsync(EnvironmentRestaurantDto? dto)
    {
        var environments = await _diningEnvironmentService.GetAllAsync(Guid.Empty);
        ViewData["Environments"] = new SelectList(
            environments.Value ?? Enumerable.Empty<DiningEnvironment>(),
            nameof(DiningEnvironment.Id),
            nameof(DiningEnvironment.Name),
            dto?.EnvironmentId);

        var restaurants = await _restaurantService.GetAllAsync(Guid.Empty);
        ViewData["Restaurants"] = new SelectList(
            restaurants.Value ?? Enumerable.Empty<Restaurant>(),
            nameof(Restaurant.Id),
            nameof(Restaurant.Name),
            dto?.RestaurantId);

        await PopulateOwnersAsync();
    }
}
