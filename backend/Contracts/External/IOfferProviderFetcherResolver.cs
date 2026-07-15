using Domain;

namespace Contracts.External;

public interface IOfferProviderFetcherResolver
{
    IOfferProviderFetcher? Resolve(EOfferProviderType providerType);
}
