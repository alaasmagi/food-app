using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class FavouriteEntityMapper : IMapper<Favourite, FavouriteEntity>
{
    public Favourite? Map(FavouriteEntity? entity)
    {
        return entity == null ? null : new Favourite
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            RestaurantId = entity.RestaurantId,
            Rating = entity.Rating,
            Note = entity.Note,
        };
    }

    public IEnumerable<Favourite>? Map(IEnumerable<FavouriteEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public FavouriteEntity? Map(Favourite? entity)
    {
        return entity == null ? null : new FavouriteEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            RestaurantId = entity.RestaurantId,
            Rating = entity.Rating,
            Note = entity.Note,
        };
    }

    public IEnumerable<FavouriteEntity>? Map(IEnumerable<Favourite>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
