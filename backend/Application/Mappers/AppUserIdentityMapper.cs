using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class AppUserIdentityMapper : IMapper<AppUser, AppUser>
{
    public AppUser? Map(AppUser? entity)
    {
        return entity;
    }

    public IEnumerable<AppUser>? Map(IEnumerable<AppUser>? entities)
    {
        return entities;
    }
}
