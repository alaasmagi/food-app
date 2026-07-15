using Base.Domain;

namespace Domain;

public class OfferProvider : BaseEntityWithConcurrency
{
    public string Name { get; set; } = default!;
    public EOfferProviderType ProviderType { get; set; }
    public string OfferLocator { get; set; } = default!;
    public string OfferTextLocator { get; set; } = default!;
    public string OfferPriceLocator { get; set; } = default!;
}
