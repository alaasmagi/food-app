using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class FavouritesController : UserScopedAdminController<FavouriteDto, Favourite>
{
    private readonly IRestaurantService _restaurantService;

    public FavouritesController(
        IFavouriteService service,
        IMapper<FavouriteDto, Favourite> mapper,
        IAppUserService appUserService,
        IRestaurantService restaurantService)
        : base(service, mapper, appUserService)
    {
        _restaurantService = restaurantService;
    }

    protected override string EntityName => "Favourite";

    protected override async Task PopulateEditorAsync(FavouriteDto? dto)
    {
        var restaurants = await _restaurantService.GetAllAsync(Guid.Empty);
        ViewData["Restaurants"] = new SelectList(
            restaurants.Value ?? Enumerable.Empty<Restaurant>(),
            nameof(Restaurant.Id),
            nameof(Restaurant.Name),
            dto?.RestaurantId);
        await PopulateOwnersAsync();
    }
}
