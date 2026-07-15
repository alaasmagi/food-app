using Base.Contracts.DTO;
using Domain;

namespace Contracts.External;

public interface IOfferProviderFetcher
{
    EOfferProviderType ProviderType { get; }

    Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> FetchAsync(
        Restaurant restaurant,
        OfferProvider provider,
        CancellationToken ct = default);
}
