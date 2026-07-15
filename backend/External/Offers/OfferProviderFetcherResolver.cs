using Contracts.External;
using Domain;

namespace External.Offers;

public class OfferProviderFetcherResolver(IEnumerable<IOfferProviderFetcher> fetchers) : IOfferProviderFetcherResolver
{
    private readonly IReadOnlyDictionary<EOfferProviderType, IOfferProviderFetcher> _fetchers =
        fetchers.ToDictionary(fetcher => fetcher.ProviderType);

    public IOfferProviderFetcher? Resolve(EOfferProviderType providerType)
    {
        return _fetchers.GetValueOrDefault(providerType);
    }
}
