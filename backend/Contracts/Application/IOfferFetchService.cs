using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IOfferFetchService
{
    Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default);
}
