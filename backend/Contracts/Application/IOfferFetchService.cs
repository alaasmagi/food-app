using Base.Contracts.DTO;

namespace Contracts.Application;

public interface IOfferFetchService
{
    Task<IMethodResponse<string>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default);
}
