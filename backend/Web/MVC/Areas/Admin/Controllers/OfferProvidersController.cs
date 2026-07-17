using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using DTO.Web;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Web.MVC.Areas.Admin.Controllers;

public sealed class OfferProvidersController : AdminCrudController<OfferProviderDto, OfferProvider>
{
    public OfferProvidersController(
        IOfferProviderService service,
        IMapper<OfferProviderDto, OfferProvider> mapper)
        : base(service, mapper)
    {
    }

    protected override string EntityName => "Offer provider";

    protected override Task PopulateEditorAsync(OfferProviderDto? dto)
    {
        ViewData["ProviderTypes"] = new SelectList(
            Enum.GetValues<EOfferProviderType>().Select(t => new { Value = (int)t, Text = t.ToString() }),
            "Value",
            "Text",
            dto == null ? null : (int)dto.ProviderType);
        return Task.CompletedTask;
    }
}
