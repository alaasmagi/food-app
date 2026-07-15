using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IOfferProviderRepository : IBaseRepository<OfferProvider>
{
    Task<bool> IsReferencedByRestaurantAsync(Guid id, CancellationToken ct = default);
}
