using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class FavouriteIdentityMapper : IMapper<Favourite, Favourite>
{
    public Favourite? Map(Favourite? entity)
    {
        return entity;
    }

    public IEnumerable<Favourite>? Map(IEnumerable<Favourite>? entities)
    {
        return entities;
    }
}
