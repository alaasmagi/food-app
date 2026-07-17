using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class RestaurantsController : AdminCrudController<RestaurantDto, Restaurant>
{
    private readonly IOfferProviderService _offerProviderService;

    public RestaurantsController(
        IRestaurantService service,
        IMapper<RestaurantDto, Restaurant> mapper,
        IOfferProviderService offerProviderService)
        : base(service, mapper)
    {
        _offerProviderService = offerProviderService;
    }

    protected override string EntityName => "Restaurant";

    protected override async Task PopulateEditorAsync(RestaurantDto? dto)
    {
        var providers = await _offerProviderService.GetAllAsync(Guid.Empty);
        ViewData["OfferProviders"] = new SelectList(
            providers.Value ?? Enumerable.Empty<OfferProvider>(),
            nameof(OfferProvider.Id),
            nameof(OfferProvider.Name),
            dto?.OfferProviderId);
    }
}
