using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IFavouriteRepository : IBaseRepository<Favourite>
{
    Task<Favourite?> GetByRestaurantAsync(Guid restaurantId, Guid actor, CancellationToken ct = default);
}
