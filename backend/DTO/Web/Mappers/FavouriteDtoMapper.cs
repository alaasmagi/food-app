using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class FavouriteDtoMapper : IMapper<FavouriteDto, Favourite>
{
    public FavouriteDto? Map(Favourite? entity)
    {
        return entity == null ? null : new FavouriteDto
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            RestaurantId = entity.RestaurantId,
            Rating = entity.Rating,
            Note = entity.Note,
        };
    }

    public IEnumerable<FavouriteDto>? Map(IEnumerable<Favourite>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public Favourite? Map(FavouriteDto? entity)
    {
        return entity == null ? null : new Favourite
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
            RestaurantId = entity.RestaurantId,
            Rating = entity.Rating,
            Note = entity.Note,
        };
    }

    public IEnumerable<Favourite>? Map(IEnumerable<FavouriteDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
